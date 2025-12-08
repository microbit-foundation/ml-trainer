/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { deployment } from "./deployment";
import { flags } from "./flags";
import { Logging } from "./logging/logging";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { Confidences, predict, trainModel } from "./ml";
import {
  DataSamplesView,
  DownloadState,
  DownloadStep,
  Action,
  ActionData,
  MicrobitToFlash,
  PostImportDialogState,
  RecordingData,
  SaveState,
  SaveStep,
  TourTrigger,
  TourState,
  TrainModelDialogStage,
  EditorStartUp,
  TourTriggerName,
  tourSequence,
} from "./model";
import { defaultSettings, Settings } from "./settings";
import { getTotalNumSamples } from "./utils/actions";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import {
  createUntitledProject,
  currentDataWindow,
  DataWindow,
  legacyDataWindow,
  untitledProjectName,
} from "./project-utils";
import { mlSettings } from "./mlConfig";
import { BufferedData } from "./buffered-data";
import { getDetectedAction } from "./utils/prediction";
import { getTour as getTourSpec } from "./tours";
import { createPromise, PromiseInfo } from "./hooks/use-promise-ref";
import { Database } from "./storage";

const storage = new Database();

export const modelUrl = "indexeddb://micro:bit-ai-creator-model";

const createFirstAction = () => ({
  icon: defaultIcons[0],
  ID: Date.now(),
  name: "",
  recordings: [],
});

interface PredictionResult {
  confidences: Confidences;
  detected: Action | undefined;
}

const updateProject = (
  project: MakeCodeProject,
  projectEdited: boolean,
  actions: ActionData[],
  model: tf.LayersModel | undefined,
  dataWindow: DataWindow
): Pick<Store, "project" | "projectEdited" | "appEditNeedsFlushToEditor"> => {
  const actionsData = { data: actions };
  const updatedProject = {
    ...project,
    text: {
      ...project.text,
      ...(projectEdited
        ? generateCustomFiles(actionsData, model, dataWindow, project)
        : generateProject(
            project.header?.name ?? untitledProjectName,
            actionsData,
            model,
            dataWindow
          ).text),
    },
  };
  return {
    project: updatedProject,
    projectEdited,
    appEditNeedsFlushToEditor: true,
  };
};

export interface State {
  actions: ActionData[];
  dataWindow: DataWindow;
  model: tf.LayersModel | undefined;

  timestamp: number | undefined;

  isRecording: boolean;

  project: MakeCodeProject;
  /**
   * We use this for the UI to tell when we've switched new project,
   * e.g. to show a toast.
   */
  projectLoadTimestamp: number;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;
  /**
   * Set to true when we need to update MakeCode before we open it.
   */
  appEditNeedsFlushToEditor: boolean;
  isEditorOpen: boolean;
  isEditorReady: boolean;
  /**
   * Whether we're expecting an editorChange call with a new header id
   * because we've
   *
   * In this case we need to update app state from the project.
   */
  isEditorLoadingFile: boolean;
  /**
   * Whether we're expecting a editorChange call with a new header id
   * because we've imported an updated copy of the project.
   *
   * In this case app state (e.g. dataset) will already be in sync.
   */
  isEditorImportingState: boolean;
  editorStartUp: EditorStartUp;
  editorStartUpTimestamp: number;
  editorPromises: {
    editorReadyPromise: PromiseInfo<void>;
    editorContentLoadedPromise: PromiseInfo<void>;
  };
  isEditorTimedOutDialogOpen: boolean;
  langChanged: boolean;

  download: DownloadState;
  downloadFlashingProgress: number;
  save: SaveState;

  settings: Settings;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;

  tourState?: TourState;
  postConnectTourTrigger?: TourTrigger;
  postImportDialogState: PostImportDialogState;

  predictionInterval: ReturnType<typeof setInterval> | undefined;
  predictionResult: PredictionResult | undefined;

  isLanguageDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isConnectFirstDialogOpen: boolean;
  isAboutDialogOpen: boolean;
  isFeedbackFormOpen: boolean;
  isDeleteAllActionsDialogOpen: boolean;
  isDeleteActionDialogOpen: boolean;
  isIncompatibleEditorDeviceDialogOpen: boolean;
  isNameProjectDialogOpen: boolean;
  isRecordingDialogOpen: boolean;
  isConnectToRecordDialogOpen: boolean;
}

export interface ConnectOptions {
  postConnectTourTrigger?: TourTrigger;
}

export interface Actions {
  loadProjectFromStorage(): Promise<void>;
  addNewAction(): Promise<void>;
  addActionRecording(
    id: ActionData["ID"],
    recording: RecordingData
  ): Promise<void>;
  deleteAction(action: ActionData): Promise<void>;
  setActionName(id: ActionData["ID"], name: string): Promise<void>;
  setActionIcon(id: ActionData["ID"], icon: MakeCodeIcon): Promise<void>;
  setRequiredConfidence(id: ActionData["ID"], value: number): Promise<void>;
  deleteActionRecording(
    id: ActionData["ID"],
    recordingId: number
  ): Promise<void>;
  deleteAllActions(): Promise<void>;
  downloadDataset(): void;

  dataCollectionMicrobitConnectionStart(options?: ConnectOptions): void;
  dataCollectionMicrobitConnected(): void;

  loadDataset(actions: ActionData[]): Promise<void>;
  loadProject(project: MakeCodeProject, name: string): Promise<void>;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(projectName?: string): Promise<void>;
  trainModelFlowStart: (callback?: () => void) => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  setSettings(update: Partial<Settings>): Promise<void>;
  setLanguage(languageId: string): Promise<void>;

  /**
   * Resets the project.
   */
  resetProject(): Promise<void>;
  /**
   * Sets the project name.
   */
  setProjectName(name: string): Promise<void>;

  /**
   * When interacting outside of React to sync with MakeCode it's important to have
   * the current project after state changes.
   */
  getCurrentProject(): MakeCodeProject;
  checkIfProjectNeedsFlush(): boolean;
  checkIfLangChanged(): boolean;
  langChangeFlushedToEditor(): void;
  editorChange(project: MakeCodeProject): Promise<void>;
  editorReady(): void;
  editorTimedOut(): void;
  getEditorStartUp(): EditorStartUp;
  setIsEditorTimedOutDialogOpen(isOpen: boolean): void;
  setEditorLoadingFile(): void;
  setEditorImportingState(): void;
  projectFlushedToEditor(): void;

  setDownload(state: DownloadState): void;
  // TODO: does the persistence slow this down? we could move it to another store
  setDownloadFlashingProgress(value: number): void;
  setSave(state: SaveState): void;

  tourStart(trigger: TourTrigger, manual?: boolean): Promise<void>;
  tourNext(): void;
  tourBack(): void;
  tourComplete(markCompleted: TourTriggerName[]): Promise<void>;

  setPostConnectTourTrigger(trigger: TourTrigger | undefined): void;

  setDataSamplesView(view: DataSamplesView): Promise<void>;
  setShowGraphs(show: boolean): Promise<void>;

  setPostImportDialogState(state: PostImportDialogState): void;
  startPredicting(buffer: BufferedData): void;
  stopPredicting(): void;

  languageDialogOnOpen(): void;
  settingsDialogOnOpen(): void;
  connectFirstDialogOnOpen(): void;
  aboutDialogOnOpen(): void;
  feedbackFormOnOpen(): void;
  nameProjectDialogOnOpen(): void;
  deleteAllActionsDialogOnOpen(): void;
  deleteActionDialogOnOpen(): void;
  incompatibleEditorDeviceDialogOnOpen(): void;
  recordingDialogOnOpen(): void;
  connectToRecordDialogOnOpen(): void;
  closeDialog(): void;
  isNonConnectionDialogOpen(): boolean;
}

type Store = State & Actions;

const createMlStore = (logging: Logging) => {
  return create<Store>()(
    devtools(
      (set, get) => ({
        timestamp: undefined,
        actions: [],
        dataWindow: currentDataWindow,
        isRecording: false,
        project: createUntitledProject(),
        projectLoadTimestamp: 0,
        download: {
          step: DownloadStep.None,
          microbitToFlash: MicrobitToFlash.Default,
        },
        downloadFlashingProgress: 0,
        save: {
          step: SaveStep.None,
        },
        projectEdited: false,
        settings: defaultSettings,
        model: undefined,
        isEditorOpen: false,
        isEditorReady: false,
        isEditorLoadingFile: false,
        isEditorImportingState: false,
        editorStartUp: "in-progress",
        editorStartUpTimestamp: Date.now(),
        editorPromises: {
          editorReadyPromise: createPromise<void>(),
          editorContentLoadedPromise: createPromise<void>(),
        },
        isEditorTimedOutDialogOpen: false,
        langChanged: false,
        appEditNeedsFlushToEditor: true,
        // This dialog flow spans two pages
        trainModelDialogStage: TrainModelDialogStage.Closed,
        trainModelProgress: 0,
        dataSamplesView: DataSamplesView.Graph,
        postImportDialogState: PostImportDialogState.None,
        predictionInterval: undefined,
        predictionResult: undefined,
        isLanguageDialogOpen: false,
        isSettingsDialogOpen: false,
        isConnectFirstDialogOpen: false,
        isAboutDialogOpen: false,
        isFeedbackFormOpen: false,
        isDeleteAllActionsDialogOpen: false,
        isNameProjectDialogOpen: false,
        isRecordingDialogOpen: false,
        isConnectToRecordDialogOpen: false,
        isDeleteActionDialogOpen: false,
        isIncompatibleEditorDeviceDialogOpen: false,

        async setSettings(update: Partial<Settings>) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            ...update,
          };
          set({ settings: updatedSettings }, false, "setSettings");
          await storageWithErrHandling<string>(() =>
            storage.updateSettings(updatedSettings)
          );
        },

        async setLanguage(languageId: string) {
          const { settings } = get();
          if (languageId === settings.languageId) {
            // No need to update language if language is the same.
            // MakeCode does not reload.
            return;
          }
          const updatedSettings = {
            ...settings,
            languageId,
          };
          set(
            {
              settings: updatedSettings,
              editorPromises: {
                editorReadyPromise: createPromise<void>(),
                editorContentLoadedPromise: createPromise<void>(),
              },
              isEditorReady: false,
              editorStartUp: "in-progress",
              editorStartUpTimestamp: Date.now(),
              langChanged: true,
            },
            false,
            "setLanguage"
          );
          await storageWithErrHandling<string>(() =>
            storage.updateSettings(updatedSettings)
          );
        },

        async newSession(projectName?: string) {
          const untitledProject = createUntitledProject();
          const timestamp = Date.now();
          const projectEdited = false;
          const newProject = projectName
            ? renameProject(untitledProject, projectName)
            : untitledProject;
          set(
            {
              actions: [],
              dataWindow: currentDataWindow,
              model: undefined,
              project: newProject,
              projectEdited,
              appEditNeedsFlushToEditor: true,
              timestamp,
            },
            false,
            "newSession"
          );
          await storageWithErrHandling<string | void>([
            storage.deleteAllActions(),
            storage.updateProjectData({ timestamp }),
            storage.updateMakeCodeProject({
              project: newProject,
              projectEdited,
            }),
          ]);
        },

        setEditorOpen(open: boolean) {
          set(
            ({ download }) => ({
              isEditorOpen: open,
              download: {
                ...download,
                usbDevice: undefined,
              },
            }),
            false,
            "setEditorOpen"
          );
        },

        recordingStarted() {
          set({ isRecording: true }, false, "recordingStarted");
        },
        recordingStopped() {
          set({ isRecording: false }, false, "recordingStopped");
        },

        async loadProjectFromStorage() {
          set(await storage.loadProject());
        },

        async addNewAction() {
          const { actions, dataWindow, project, projectEdited } = get();
          const newAction: ActionData = {
            icon: actionIcon({
              isFirstAction: actions.length === 0,
              existingActions: actions,
            }),
            ID: Date.now(),
            name: "",
            recordings: [],
          };
          const updatedActions = [...actions, newAction];
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            dataWindow
          );
          set({
            actions: updatedActions,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling<string>([
            storage.addAction(newAction),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async addActionRecording(
          id: ActionData["ID"],
          recording: RecordingData
        ) {
          const { actions, dataWindow, project, projectEdited } = get();
          let updatedAction: ActionData;
          const updatedActions = actions.map((action) => {
            if (action.ID === id) {
              updatedAction = {
                ...action,
                recordings: [recording, ...action.recordings],
              };
              return updatedAction;
            }
            return action;
          });
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            dataWindow
          );
          set({
            actions: updatedActions,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling<void>(() =>
            storage.addRecording(recording, updatedAction)
          );
        },

        async deleteAction(action: ActionData) {
          const { actions, dataWindow, project, projectEdited } = get();
          const newActions = actions.filter((a) => a.ID !== action.ID);
          const newDataWindow =
            newActions.length === 0 ? currentDataWindow : dataWindow;
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            undefined,
            newDataWindow
          );
          set({
            actions:
              newActions.length === 0 ? [createFirstAction()] : newActions,
            dataWindow: newDataWindow,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            storage.deleteAction(action),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async setActionName(id: ActionData["ID"], name: string) {
          const { actions, dataWindow, project, projectEdited, model } = get();
          let updatedAction: ActionData;
          const newActions = actions.map((action) => {
            if (id === action.ID) {
              updatedAction = { ...action, name };
              return updatedAction;
            }
            return action;
          });
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          set({
            actions: newActions,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            storage.updateAction(updatedAction!),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async setActionIcon(id: ActionData["ID"], icon: MakeCodeIcon) {
          const { actions, dataWindow, project, projectEdited, model } = get();
          const updatedActions: ActionData[] = [];
          // If we're changing the action to use an icon that's already in use
          // then we update the action that's using the icon to use the action's current icon
          const currentIcon = actions.find((a) => a.ID === id)?.icon;
          const newActions = actions.map((action) => {
            if (action.ID === id) {
              const updatedAction = { ...action, icon };
              updatedActions.push(updatedAction);
              return updatedAction;
            } else if (
              action.ID !== id &&
              action.icon === icon &&
              currentIcon
            ) {
              const updatedAction = { ...action, icon: currentIcon };
              updatedActions.push(updatedAction);
              return updatedAction;
            }
            return action;
          });
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          set({
            actions: newActions,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            ...updatedActions.map((action) => storage.updateAction(action)),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async setRequiredConfidence(id: ActionData["ID"], value: number) {
          const { actions, dataWindow, project, projectEdited, model } = get();
          let updatedAction: ActionData;
          const newActions = actions.map((action) => {
            if (id === action.ID) {
              updatedAction = { ...action, requiredConfidence: value };
              return updatedAction;
            }
            return action;
          });
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          set({
            actions: newActions,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            storage.updateAction(updatedAction!),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async deleteActionRecording(id: ActionData["ID"], recordingId: number) {
          const { actions, dataWindow, project, projectEdited } = get();
          let updatedAction: ActionData;
          const updatedActions = actions.map((action) => {
            if (id !== action.ID) {
              return action;
            }
            const recordings = action.recordings.filter(
              (recording) => recording.ID !== recordingId
            );
            updatedAction = { ...action, recordings };
            return updatedAction;
          });
          const numRecordings = updatedActions.reduce(
            (acc, curr) => acc + curr.recordings.length,
            0
          );
          const newDataWindow =
            numRecordings === 0 ? currentDataWindow : dataWindow;
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            newDataWindow
          );
          set({
            actions: updatedActions,
            dataWindow: newDataWindow,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            storage.deleteRecording(recordingId.toString(), updatedAction!),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        async deleteAllActions() {
          const { project, projectEdited } = get();
          const updatedProject = updateProject(
            project,
            projectEdited,
            [],
            undefined,
            currentDataWindow
          );
          set({
            actions: [createFirstAction()],
            dataWindow: currentDataWindow,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling<string | void>([
            storage.deleteAllActions(),
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            }),
          ]);
        },

        downloadDataset() {
          const { actions, project } = get();
          const a = document.createElement("a");
          a.setAttribute(
            "href",
            "data:application/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(actions, null, 2))
          );
          a.setAttribute(
            "download",
            `${project.header?.name ?? untitledProjectName}-data-samples.json`
          );
          a.style.display = "none";
          a.click();
        },

        async loadDataset(newActions: ActionData[]) {
          const { settings, project, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          // Older datasets did not have icons. Add icons to actions where these are missing.
          const newActionsWithIcons = [...newActions];
          newActionsWithIcons.forEach((a) => {
            if (!a.icon) {
              a.icon = actionIcon({
                isFirstAction: false,
                existingActions: newActionsWithIcons,
              });
            }
          });
          const timestamp = Date.now();
          const dataWindow = getDataWindowFromActions(newActionsWithIcons);
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActionsWithIcons,
            undefined,
            dataWindow
          );
          set({
            settings: updatedSettings,
            actions: newActionsWithIcons,
            dataWindow,
            model: undefined,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling<void>(() =>
            storage.importProject(
              newActionsWithIcons,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              {
                timestamp,
              },
              updatedSettings
            )
          );
        },

        /**
         * Generally project loads go via MakeCode as it reads the hex but when we open projects
         * from microbit.org we have the JSON already and use this route.
         */
        async loadProject(project: MakeCodeProject, name: string) {
          const { settings } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          const newActions = getActionsFromProject(project);
          const timestamp = Date.now();
          const projectEdited = true;
          set(({ project: prevProject }) => {
            project = renameProject(project, name);
            project = {
              ...project,
              header: {
                ...project.header!,
                // .org projects have a partial header with no id which causes MakeCode sadness
                id: project.header?.id ?? prevProject.header!.id,
              },
            };
            return {
              settings: updatedSettings,
              actions: newActions,
              dataWindow: getDataWindowFromActions(newActions),
              model: undefined,
              project,
              projectEdited,
              appEditNeedsFlushToEditor: true,
              timestamp,
              // We don't update projectLoadTimestamp here as we don't want a toast notification for .org import
            };
          });
          await storageWithErrHandling<void>(() =>
            storage.importProject(
              newActions,
              { project, projectEdited },
              { timestamp },
              updatedSettings
            )
          );
        },

        closeTrainModelDialogs() {
          set({
            trainModelDialogStage: TrainModelDialogStage.Closed,
          });
        },

        async trainModelFlowStart(callback?: () => void) {
          const {
            settings: { showPreTrainHelp },
            actions,
            trainModel,
          } = get();
          if (!hasSufficientDataForTraining(actions)) {
            set({
              trainModelDialogStage: TrainModelDialogStage.InsufficientData,
            });
          } else if (showPreTrainHelp) {
            set({
              trainModelDialogStage: TrainModelDialogStage.Help,
            });
          } else {
            await trainModel();
            callback?.();
          }
        },

        async trainModel() {
          const { actions, dataWindow, project, projectEdited } = get();
          logging.event({
            type: "model-train",
            detail: {
              actions: actions.length,
              samples: getTotalNumSamples(actions),
            },
          });
          const actionName = "trainModel";
          set({
            trainModelDialogStage: TrainModelDialogStage.TrainingInProgress,
            trainModelProgress: 0,
          });
          // Delay so we get UI change before training starts. The initial part of training
          // can block the UI. 50 ms is not sufficient, so use 100 for now.
          await new Promise((res) => setTimeout(res, 100));
          const trainingResult = await trainModel(
            actions,
            dataWindow,
            (trainModelProgress) =>
              set({ trainModelProgress }, false, "trainModelProgress")
          );
          const model = trainingResult.error ? undefined : trainingResult.model;
          const updatedProject = updateProject(
            project,
            projectEdited,
            actions,
            model,
            dataWindow
          );
          set(
            {
              model,
              trainModelDialogStage: model
                ? TrainModelDialogStage.Closed
                : TrainModelDialogStage.TrainingError,
              ...updatedProject,
            },
            false,
            actionName
          );
          await storageWithErrHandling<string>(() =>
            storage.updateMakeCodeProject({
              project: updatedProject.project,
              projectEdited: updatedProject.projectEdited,
            })
          );
          return !trainingResult.error;
        },

        async resetProject(): Promise<void> {
          const {
            project: previousProject,
            actions,
            model,
            dataWindow,
          } = get();
          const newProject = {
            ...previousProject,
            text: {
              ...previousProject.text,
              ...generateProject(
                previousProject.header?.name ?? untitledProjectName,
                { data: actions },
                model,
                dataWindow
              ).text,
            },
          };
          set(
            {
              project: newProject,
              projectEdited: false,
              appEditNeedsFlushToEditor: true,
            },
            false,
            "resetProject"
          );
          await storageWithErrHandling<string>(() =>
            storage.updateMakeCodeProject({
              project: newProject,
              projectEdited: false,
            })
          );
        },

        async setProjectName(name: string): Promise<void> {
          const { project, projectEdited } = get();
          const updatedProject = renameProject(project, name);
          set(
            {
              appEditNeedsFlushToEditor: true,
              project: updatedProject,
            },
            false,
            "setProjectName"
          );
          await storageWithErrHandling<string>(() =>
            storage.updateMakeCodeProject({
              project: updatedProject,
              projectEdited,
            })
          );
        },

        checkIfProjectNeedsFlush() {
          return get().appEditNeedsFlushToEditor;
        },

        checkIfLangChanged() {
          return get().langChanged;
        },

        getCurrentProject() {
          return get().project;
        },

        editorReady() {
          set(
            { isEditorReady: true, editorStartUp: "done" },
            false,
            "editorReady"
          );
        },

        editorTimedOut() {
          set({ editorStartUp: "timed out" }, false, "editorTimedOut");
        },

        getEditorStartUp() {
          return get().editorStartUp;
        },

        setIsEditorTimedOutDialogOpen(isOpen: boolean) {
          set(
            { isEditorTimedOutDialogOpen: isOpen },
            false,
            "setIsEditorTimedOutDialogOpen"
          );
        },

        async editorChange(newProject: MakeCodeProject) {
          // Notes on past issues with the MakeCode integration:
          //
          // We update MakeCode only as needed. However, it loads in the
          // background because we need it to be ready. This means it will
          // have the initial project from the state open. So we must be sure
          // to update MakeCode before "Edit in MakeCode" and "Save" actions.
          //
          // MakeCode has a visibility listener that will cause it to re-run
          // its initialization when its tab becomes hidden/visible. We aim to
          // ignore this when MakeCode is closed. When MakeCode is open we'll
          // have up-to-date state to reinit MakeCode with. In the past this
          // has caused us to update app state with old data from MakeCode.
          //
          // It's too slow/async from a UI perspective to rely on only
          // understanding project contents via editorChange as they're
          // delayed by MakeCode load and then the async nature of loading a
          // project.
          //
          // We have no choice but to write to MakeCode and wait for the
          // project data in editorChange when loading a hex file.

          const actionName = "editorChange";
          const { settings, timestamp, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          let updatedTimestamp = timestamp;
          let updatedProjectEdited = projectEdited;
          let updatedProjectInStorage = true;
          let newActions: ActionData[] | undefined;
          set(
            (state) => {
              const {
                project: prevProject,
                isEditorOpen,
                isEditorImportingState,
                isEditorLoadingFile,
              } = state;
              const newProjectHeader = newProject.header!.id;
              const previousProjectHeader = prevProject.header!.id;
              if (
                (isEditorLoadingFile ||
                  isEditorOpen ||
                  isEditorImportingState) &&
                newProjectHeader !== previousProjectHeader
              ) {
                if (isEditorImportingState) {
                  // It's a change but we originated it so state is in sync.
                  logging.log(
                    `[MakeCode] Ignored header change due to us syncing state. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                  );
                  return {
                    isEditorImportingState: false,
                    // Still need to update this for the new header id.
                    project: newProject,
                  };
                } else {
                  // It's a change that originated in MakeCode, e.g. a hex load, so update our state.
                  logging.log(
                    `[MakeCode] Updating state from MakeCode header change. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                  );
                  newActions = getActionsFromProject(newProject);
                  updatedTimestamp = Date.now();
                  updatedProjectEdited = true;
                  return {
                    settings: updatedSettings,
                    project: newProject,
                    projectLoadTimestamp: updatedTimestamp,
                    timestamp: updatedTimestamp,
                    // New project loaded externally so we can't know whether its edited.
                    projectEdited: updatedProjectEdited,
                    actions: newActions,
                    dataWindow: getDataWindowFromActions(newActions),
                    model: undefined,
                    isEditorOpen: false,
                    isEditorLoadingFile: false,
                  };
                }
              } else if (isEditorOpen) {
                logging.log(
                  `[MakeCode] Edit copied to project. ID ${newProject.header?.id}`
                );
                updatedProjectEdited = true;
                return {
                  project: newProject,
                  // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
                  projectEdited: true,
                };
              } else {
                // This lets us skip more pointless init-time edits.
                logging.log(
                  `[MakeCode] Edit ignored when closed. ID ${newProject.header?.id}`
                );
                updatedProjectInStorage = false;
              }
              return state;
            },
            false,
            actionName
          );
          await storageWithErrHandling<void>(() =>
            storage.importProject(
              newActions,
              updatedProjectInStorage
                ? {
                    project: newProject,
                    projectEdited: updatedProjectEdited,
                  }
                : undefined,
              { timestamp: updatedTimestamp },
              updatedSettings
            )
          );
        },
        setDownload(download: DownloadState) {
          set({ download, downloadFlashingProgress: 0 }, false, "setDownload");
        },
        setDownloadFlashingProgress(value) {
          set({ downloadFlashingProgress: value });
        },
        setSave(save: SaveState) {
          set({ save }, false, "setSave");
        },
        setEditorLoadingFile() {
          set({ isEditorLoadingFile: true }, false, "setEditorLoadingFile");
        },
        setEditorImportingState() {
          set(
            { isEditorImportingState: true },
            false,
            "setEditorImportingState"
          );
        },
        langChangeFlushedToEditor() {
          set(
            {
              langChanged: false,
            },
            false,
            "langChangeFlushedToEditor"
          );
        },
        projectFlushedToEditor() {
          set(
            {
              appEditNeedsFlushToEditor: false,
            },
            false,
            "projectFlushedToEditor"
          );
        },
        setPostConnectTourTrigger(trigger: TourTrigger | undefined) {
          set(
            { postConnectTourTrigger: trigger },
            false,
            "setPostConnectTourId"
          );
        },
        dataCollectionMicrobitConnectionStart(options) {
          set(
            { postConnectTourTrigger: options?.postConnectTourTrigger },
            false,
            "dataCollectionMicrobitConnectionStart"
          );
        },
        dataCollectionMicrobitConnected() {
          set(
            ({ actions, tourState, postConnectTourTrigger }) => {
              return {
                actions: actions.length === 0 ? [createFirstAction()] : actions,

                // If a tour has been explicitly requested, do that.
                // Other tours are triggered by callbacks or effects on the relevant page so they run only on the correct screen.
                tourState: postConnectTourTrigger
                  ? {
                      index: 0,
                      ...getTourSpec(postConnectTourTrigger, actions),
                    }
                  : tourState,
                postConnectTourTrigger: undefined,
              };
            },
            false,
            "dataCollectionMicrobitConnected"
          );
        },

        async tourStart(trigger: TourTrigger, manual: boolean = false) {
          const { actions, settings, tourState } = get();
          if (
            manual ||
            (!tourState && !settings.toursCompleted.includes(trigger.name))
          ) {
            const tourSpec = getTourSpec(trigger, actions);
            // If manually triggered, filter out subsequent tours as they should run again too when reached
            const updatedSettings = manual
              ? {
                  ...settings,
                  toursCompleted: settings.toursCompleted.filter(
                    (t) =>
                      tourSequence.indexOf(t) <=
                      tourSequence.indexOf(trigger.name)
                  ),
                }
              : settings;
            const updatedState = {
              tourState: {
                ...tourSpec,
                index: 0,
              },
              settings: updatedSettings,
            };
            set(updatedState);
            await storageWithErrHandling<string>(() =>
              storage.updateSettings(updatedSettings)
            );
          }
        },
        tourNext() {
          set(({ tourState }) => {
            if (!tourState) {
              throw new Error("No tour");
            }
            return {
              tourState: { ...tourState, index: tourState.index + 1 },
            };
          });
        },
        tourBack() {
          set(({ tourState }) => {
            if (!tourState) {
              throw new Error("No tour");
            }
            return {
              tourState: { ...tourState, index: tourState.index - 1 },
            };
          });
        },
        async tourComplete(triggers: TourTriggerName[]) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, ...triggers])
            ),
          };
          set({
            tourState: undefined,
            settings: updatedSettings,
          });
          await storageWithErrHandling<string>(() =>
            storage.updateSettings(updatedSettings)
          );
        },

        async setDataSamplesView(view: DataSamplesView) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            dataSamplesView: view,
          };
          set({
            settings: updatedSettings,
          });
          await storageWithErrHandling<string>(() =>
            storage.updateSettings(updatedSettings)
          );
        },
        async setShowGraphs(show: boolean) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            showGraphs: show,
          };
          set({
            settings: updatedSettings,
          });
          await storageWithErrHandling<string>(() =>
            storage.updateSettings(updatedSettings)
          );
        },

        setPostImportDialogState(state: PostImportDialogState) {
          set({ postImportDialogState: state });
        },

        startPredicting(buffer: BufferedData) {
          const { actions, model, predictionInterval, dataWindow } = get();
          if (!model || predictionInterval) {
            return;
          }
          const newPredictionInterval = setInterval(() => {
            const startTime = Date.now() - dataWindow.duration;
            const input = {
              model,
              data: buffer.getSamples(startTime),
              classificationIds: actions.map((a) => a.ID),
            };
            if (input.data.x.length > dataWindow.minSamples) {
              const result = predict(input, dataWindow);
              if (result.error) {
                logging.error(result.detail);
              } else {
                const { confidences } = result;
                const detected = getDetectedAction(
                  // Get latest actions from store so that changes to
                  // recognition point are realised.
                  get().actions,
                  result.confidences
                );
                set({
                  predictionResult: {
                    detected,
                    confidences,
                  },
                });
              }
            }
          }, 1000 / mlSettings.updatesPrSecond);
          set({ predictionInterval: newPredictionInterval });
        },

        getPrediction() {
          return get().predictionResult;
        },

        stopPredicting() {
          const { predictionInterval } = get();
          if (predictionInterval) {
            clearInterval(predictionInterval);
            set({ predictionInterval: undefined });
          }
        },

        languageDialogOnOpen() {
          set({ isLanguageDialogOpen: true });
        },
        settingsDialogOnOpen() {
          set({ isSettingsDialogOpen: true });
        },
        connectFirstDialogOnOpen() {
          set({ isConnectFirstDialogOpen: true });
        },
        aboutDialogOnOpen() {
          set({ isAboutDialogOpen: true });
        },
        feedbackFormOnOpen() {
          set({ isFeedbackFormOpen: true });
        },
        deleteAllActionsDialogOnOpen() {
          set({ isDeleteAllActionsDialogOpen: true });
        },
        nameProjectDialogOnOpen() {
          set({ isNameProjectDialogOpen: true });
        },
        recordingDialogOnOpen() {
          set({ isRecordingDialogOpen: true });
        },
        connectToRecordDialogOnOpen() {
          set({ isConnectToRecordDialogOpen: true });
        },
        deleteActionDialogOnOpen() {
          set({ isDeleteActionDialogOpen: true });
        },
        incompatibleEditorDeviceDialogOnOpen() {
          set({ isIncompatibleEditorDeviceDialogOpen: true });
        },
        closeDialog() {
          set({
            isLanguageDialogOpen: false,
            isSettingsDialogOpen: false,
            isConnectFirstDialogOpen: false,
            isAboutDialogOpen: false,
            isFeedbackFormOpen: false,
            isDeleteAllActionsDialogOpen: false,
            isNameProjectDialogOpen: false,
            isRecordingDialogOpen: false,
            isConnectToRecordDialogOpen: false,
            isDeleteActionDialogOpen: false,
            isIncompatibleEditorDeviceDialogOpen: false,
          });
        },

        isNonConnectionDialogOpen() {
          const {
            isAboutDialogOpen,
            isSettingsDialogOpen,
            isConnectFirstDialogOpen,
            isLanguageDialogOpen,
            isFeedbackFormOpen,
            postImportDialogState,
            isEditorOpen,
            tourState,
            trainModelDialogStage,
            isEditorTimedOutDialogOpen,
            isDeleteAllActionsDialogOpen,
            isRecordingDialogOpen,
            isConnectToRecordDialogOpen,
            isDeleteActionDialogOpen,
            isIncompatibleEditorDeviceDialogOpen,
            save,
          } = get();
          return (
            isAboutDialogOpen ||
            isSettingsDialogOpen ||
            isConnectFirstDialogOpen ||
            isLanguageDialogOpen ||
            isFeedbackFormOpen ||
            isDeleteAllActionsDialogOpen ||
            isRecordingDialogOpen ||
            isConnectToRecordDialogOpen ||
            isDeleteActionDialogOpen ||
            isIncompatibleEditorDeviceDialogOpen ||
            postImportDialogState !== PostImportDialogState.None ||
            isEditorOpen ||
            tourState !== undefined ||
            trainModelDialogStage !== TrainModelDialogStage.Closed ||
            isEditorTimedOutDialogOpen ||
            save.step !== SaveStep.None
          );
        },
      }),
      { enabled: flags.devtools }
    )
  );
};

export const useStore = createMlStore(deployment.logging);

const getDataWindowFromActions = (actions: ActionData[]): DataWindow => {
  const dataLength = actions.flatMap((a) => a.recordings)[0]?.data.x.length;
  return dataLength >= legacyDataWindow.minSamples
    ? legacyDataWindow
    : currentDataWindow;
};

// Get data window from actions on app load.
// TODO: change when this happens.
// Don't use actions as a global value in this file, it is dangerous.
const { actions: actionsForDataWindow } = useStore.getState();
useStore.setState(
  { dataWindow: getDataWindowFromActions(actionsForDataWindow) },
  false,
  "setDataWindow"
);

tf.loadLayersModel(modelUrl)
  .then((model) => {
    if (model) {
      useStore.setState({ model }, false, "loadModel");
    }
  })
  .catch(() => {
    // This happens if there's no model.
  });

useStore.subscribe((state, prevState) => {
  const { model: newModel } = state;
  const { model: previousModel } = prevState;
  if (newModel !== previousModel) {
    if (!newModel) {
      tf.io.removeModel(modelUrl).catch(() => {
        // No IndexedDB/no model.
      });
    } else {
      newModel.save(modelUrl).catch(() => {
        // IndexedDB not available?
      });
    }
  }
});

export const useHasActions = () => {
  const actions = useStore((s) => s.actions);
  return (
    (actions.length > 0 && actions[0].name.length > 0) ||
    actions[0]?.recordings.length > 0
  );
};

const hasSufficientDataForTraining = (actions: ActionData[]): boolean => {
  return actions.length >= 2 && actions.every((a) => a.recordings.length >= 3);
};

export const useHasSufficientDataForTraining = (): boolean => {
  const actions = useStore((s) => s.actions);
  return hasSufficientDataForTraining(actions);
};

export const useHasNoStoredData = (): boolean => {
  const actions = useStore((s) => s.actions);
  return !(
    actions.length !== 0 && actions.some((a) => a.recordings.length > 0)
  );
};

type UseSettingsReturn = [Settings, (settings: Partial<Settings>) => void];

export const inContextTranslationLangId = "lol";

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useStore(
    useShallow((s) => [s.settings, s.setSettings])
  );
  const settingsOverride = flags.translate
    ? { languageId: inContextTranslationLangId }
    : {};
  return [{ ...settings, ...settingsOverride }, setSettings];
};

const actionIcon = ({
  isFirstAction,
  existingActions,
}: {
  isFirstAction: boolean;
  existingActions: Action[];
}) => {
  if (isFirstAction) {
    return defaultIcons[0];
  }
  const iconsInUse = existingActions.map((a) => a.icon);
  const useableIcons: MakeCodeIcon[] = [];
  for (const icon of defaultIcons) {
    if (!iconsInUse.includes(icon)) {
      useableIcons.push(icon);
    }
  }
  if (!useableIcons.length) {
    // Better than throwing an error.
    return "Heart";
  }
  return useableIcons[0];
};

const getActionsFromProject = (project: MakeCodeProject): ActionData[] => {
  const { text } = project;
  if (text === undefined || !("dataset.json" in text)) {
    return [];
  }
  const dataset = JSON.parse(text["dataset.json"]) as object;
  if (typeof dataset !== "object" || !("data" in dataset)) {
    return [];
  }
  return dataset.data as ActionData[];
};

const renameProject = (
  project: MakeCodeProject,
  name: string
): MakeCodeProject => {
  const pxtString = project.text?.[filenames.pxtJson];
  const pxt = JSON.parse(pxtString ?? "{}") as Record<string, unknown>;

  return {
    ...project,
    header: {
      ...project.header!,
      name,
    },
    text: {
      ...project.text,
      [filenames.pxtJson]: JSON.stringify({
        ...pxt,
        name,
      }),
    },
  };
};

const storageWithErrHandling = async <T>(
  callback: (() => Promise<T>) | Promise<T>[]
) => {
  try {
    if (Array.isArray(callback)) {
      return await Promise.all(callback);
    }
    return await callback();
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("Storage quota exceeded!", err);
    } else {
      console.error(err);
    }
    // We can in theory set error state here with useStore.setState.
  }
};

export const loadProjectFromStorage = async () => {
  const loadProjectFromStorage = useStore.getState().loadProjectFromStorage;
  await loadProjectFromStorage();
  return true;
};

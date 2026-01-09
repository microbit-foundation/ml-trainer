/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { v4 as uuid } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { BufferedData } from "./buffered-data";
import { deployment } from "./deployment";
import { flags } from "./flags";
import { createPromise, PromiseInfo } from "./hooks/use-promise-ref";
import { Logging } from "./logging/logging";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { Confidences, predict, trainModel } from "./ml";
import { mlSettings } from "./mlConfig";
import {
  Action,
  ActionData,
  DataSamplesView,
  DownloadState,
  DownloadStep,
  EditorStartUp,
  MicrobitToFlash,
  OldActionData,
  PostImportDialogState,
  RecordingData,
  SaveState,
  SaveStep,
  tourSequence,
  TourState,
  TourTrigger,
  TourTriggerName,
  TrainModelDialogStage,
} from "./model";
import {
  createUntitledProject,
  currentDataWindow,
  DataWindow,
  legacyDataWindow,
  migrateLegacyActionDataAndAssignNewIds,
  untitledProjectName,
} from "./project-utils";
import { defaultSettings, Settings } from "./settings";
import { Database, ProjectDataWithActions, StorageError } from "./storage";
import { getTour as getTourSpec } from "./tours";
import { getTotalNumSamples } from "./utils/actions";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { getDetectedAction } from "./utils/prediction";
import { LoadAction } from "./hooks/project-hooks";
import {
  broadcastChannel,
  BroadcastChannelData,
  BroadcastChannelMessageType,
} from "./broadcast-channel";
import { projectSessionStorage } from "./session-storage";

const storage = new Database();

const createFirstAction = (): ActionData => ({
  icon: defaultIcons[0],
  id: uuid(),
  name: "",
  recordings: [],
  createdAt: Date.now(),
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
  id: string | undefined;
  actions: ActionData[];
  dataWindow: DataWindow;
  model: tf.LayersModel | undefined;

  timestamp: number;

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

  allProjectData: ProjectDataWithActions[];
}

export interface ConnectOptions {
  postConnectTourTrigger?: TourTrigger;
}

export interface Actions {
  getAllProjectData(): Promise<void>;
  loadProjectFromStorage(id: string): Promise<void>;
  updateProjectUpdatedAt(): Promise<void>;
  deleteProject(id: string): Promise<void>;
  clearProjectState(): void;
  addNewAction(): Promise<void>;
  addActionRecording(id: string, recording: RecordingData): Promise<void>;
  deleteAction(action: ActionData): Promise<void>;
  setActionName(id: string, name: string): Promise<void>;
  setActionIcon(id: string, icon: MakeCodeIcon): Promise<void>;
  setRequiredConfidence(id: string, value: number): Promise<void>;
  deleteActionRecording(id: string, recordingId: string): Promise<void>;
  deleteAllActions(): Promise<void>;
  downloadDataset(): void;

  dataCollectionMicrobitConnectionStart(options?: ConnectOptions): void;
  dataCollectionMicrobitConnected(): void;

  loadDataset(actions: ActionData[], loadAction: LoadAction): Promise<void>;
  loadProject(project: MakeCodeProject, name: string): Promise<void>;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(projectName?: string): Promise<void>;
  trainModelFlowStart: (callback?: () => void) => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  removeModel(): void;
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
        id: undefined,
        timestamp: 0,
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

        allProjectData: [],

        async setSettings(update: Partial<Settings>) {
          const { id, settings } = get();
          const updatedSettings = {
            ...settings,
            ...update,
          };
          const timestamp = Date.now();
          set({ settings: updatedSettings, timestamp }, false, "setSettings");
          await storageWithErrHandling(() =>
            storage.updateSettings(id, updatedSettings, timestamp)
          );
        },

        async setLanguage(languageId: string) {
          const { id, settings } = get();
          if (languageId === settings.languageId) {
            // No need to update language if language is the same.
            // MakeCode does not reload.
            return;
          }
          const updatedSettings = {
            ...settings,
            languageId,
          };
          const timestamp = Date.now();
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
              timestamp,
            },
            false,
            "setLanguage"
          );
          await storageWithErrHandling(() =>
            storage.updateSettings(id, updatedSettings, timestamp)
          );
        },

        async newSession(projectName?: string) {
          const untitledProject = createUntitledProject();
          const timestamp = Date.now();
          const projectEdited = false;
          const newProject = projectName
            ? renameProject(untitledProject, projectName)
            : untitledProject;
          const id = uuid();
          set(
            {
              id,
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
          projectSessionStorage.setProjectId(id);
          await storageWithErrHandling(() =>
            storage.newSession(
              {
                project: newProject,
                projectEdited,
              },
              { timestamp, name: projectName ?? untitledProjectName, id }
            )
          );
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

        async loadProjectFromStorage(id: string) {
          const persistedData = await storageWithErrHandling(
            () => storage.getProject(id),
            false
          );
          projectSessionStorage.setProjectId(id);
          set({
            // Get data window from actions on app load.
            dataWindow: getDataWindowFromActions(persistedData.actions),
            appEditNeedsFlushToEditor: true,
            isEditorOpen: false,
            ...persistedData,
          });
        },

        async getAllProjectData(): Promise<void> {
          const allProjectData = await storageWithErrHandling(
            () => storage.getAllProjectData(),
            false
          );
          set({
            allProjectData,
          });
        },

        async updateProjectUpdatedAt() {
          const { id } = get();
          await storageWithErrHandling(() =>
            storage.updateProjectTimestamp(id, Date.now())
          );
        },

        async deleteProject(id) {
          const { id: currentProjectId, allProjectData } = get();
          set({
            ...(() => {
              if (id === currentProjectId) {
                // You have deleted the currently open project.
                return {
                  id: undefined,
                  actions: [],
                  dataWindow: currentDataWindow,
                  model: undefined,
                  project: createUntitledProject(),
                  projectEdited: false,
                  appEditNeedsFlushToEditor: true,
                  timestamp: undefined,
                };
              }
              return {};
            })(),
            allProjectData: allProjectData.filter((p) => p.id !== id),
          });
          if (id === currentProjectId) {
            projectSessionStorage.clearProjectId();
          }
          await storageWithErrHandling(() => storage.deleteProject(id), false);
          const message: BroadcastChannelData = {
            messageType: BroadcastChannelMessageType.DELETE_PROJECT,
            projectId: id,
          };
          broadcastChannel.postMessage(message);
        },

        clearProjectState() {
          const untitledProject = createUntitledProject();
          set({
            id: undefined,
            actions: [],
            dataWindow: currentDataWindow,
            model: undefined,
            project: untitledProject,
            projectEdited: false,
            appEditNeedsFlushToEditor: true,
            timestamp: undefined,
          });
          projectSessionStorage.clearProjectId();
        },

        async addNewAction() {
          const { actions, dataWindow, id, project, projectEdited } = get();
          const newAction: ActionData = {
            icon: actionIcon({
              isFirstAction: actions.length === 0,
              existingActions: actions,
            }),
            id: uuid(),
            name: "",
            recordings: [],
            createdAt: Date.now(),
          };
          const updatedActions = [...actions, newAction];
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            dataWindow
          );
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            model: undefined,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.addAction(
              id,
              newAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async addActionRecording(actionId: string, recording: RecordingData) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          let updatedAction: ActionData;
          const updatedActions = actions.map((action) => {
            if (action.id === actionId) {
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
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            model: undefined,
            timestamp,

            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.addRecording(
              id,
              recording,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteAction(action: ActionData) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          const newActions = actions.filter((a) => a.id !== action.id);
          const newDataWindow =
            newActions.length === 0 ? currentDataWindow : dataWindow;
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            undefined,
            newDataWindow
          );
          const timestamp = Date.now();
          set({
            actions:
              newActions.length === 0 ? [createFirstAction()] : newActions,
            dataWindow: newDataWindow,
            model: undefined,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.deleteAction(
              id,
              action,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setActionName(actionId: string, name: string) {
          const { actions, dataWindow, id, project, projectEdited, model } =
            get();
          let updatedAction: ActionData;
          const newActions = actions.map((action) => {
            if (actionId === action.id) {
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
          const timestamp = Date.now();
          set({
            actions: newActions,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.updateAction(
              id,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setActionIcon(actionId: string, icon: MakeCodeIcon) {
          const { actions, dataWindow, id, project, projectEdited, model } =
            get();
          const updatedActions: ActionData[] = [];
          // If we're changing the action to use an icon that's already in use
          // then we update the action that's using the icon to use the action's current icon
          const currentIcon = actions.find((a) => a.id === actionId)?.icon;
          const newActions = actions.map((action) => {
            if (action.id === actionId) {
              const updatedAction = { ...action, icon };
              updatedActions.push(updatedAction);
              return updatedAction;
            } else if (
              action.id !== actionId &&
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
          const timestamp = Date.now();
          set({
            actions: newActions,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.updateActions(
              id,
              updatedActions,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setRequiredConfidence(actionId: string, value: number) {
          const { actions, dataWindow, id, project, projectEdited, model } =
            get();
          let updatedAction: ActionData;
          const newActions = actions.map((action) => {
            if (actionId === action.id) {
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
          const timestamp = Date.now();
          set({
            actions: newActions,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.updateAction(
              id,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteActionRecording(actionId: string, recordingId: string) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          let updatedAction: ActionData;
          const updatedActions = actions.map((action) => {
            if (actionId !== action.id) {
              return action;
            }
            const recordings = action.recordings.filter(
              (recording) => recording.id !== recordingId
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
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            dataWindow: newDataWindow,
            model: undefined,
            timestamp,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.deleteRecording(
              id,
              recordingId.toString(),
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteAllActions() {
          const { id, project, projectEdited } = get();
          const updatedProject = updateProject(
            project,
            projectEdited,
            [],
            undefined,
            currentDataWindow
          );
          const timestamp = Date.now();
          set({
            actions: [createFirstAction()],
            dataWindow: currentDataWindow,
            model: undefined,
            ...updatedProject,
          });
          await storageWithErrHandling(() =>
            storage.deleteAllActions(
              id,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
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

        async loadDataset(newActions: ActionData[], loadAction: LoadAction) {
          const { id, settings, project, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          const newActionsWithIcons =
            migrateLegacyActionDataAndAssignNewIds(newActions);
          // Older datasets did not have icons. Add icons to actions where these are missing.
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
          if (loadAction === "replaceActions") {
            set({
              settings: updatedSettings,
              actions: newActionsWithIcons,
              dataWindow,
              model: undefined,
              timestamp,
              ...updatedProject,
            });
            await storageWithErrHandling(() =>
              storage.replaceActions(
                newActionsWithIcons,
                {
                  project: updatedProject.project,
                  projectEdited: updatedProject.projectEdited,
                },
                {
                  timestamp,
                  id,
                },
                updatedSettings
              )
            );
          } else if (loadAction === "replaceProject") {
            const newId = uuid();
            set({
              id: newId,
              settings: updatedSettings,
              actions: newActionsWithIcons,
              dataWindow,
              model: undefined,
              timestamp,
              ...updatedProject,
            });
            projectSessionStorage.setProjectId(newId);
            await storageWithErrHandling(() =>
              storage.importProject(
                newActionsWithIcons,
                {
                  project: updatedProject.project,
                  projectEdited: updatedProject.projectEdited,
                },
                {
                  timestamp,
                  id: newId,
                },
                updatedSettings
              )
            );
          }
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
          const id = uuid();
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
              id,
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
          projectSessionStorage.setProjectId(id);
          await storageWithErrHandling(() =>
            storage.importProject(
              newActions,
              { project, projectEdited },
              { timestamp, id },
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
          const { actions, dataWindow, id, project, projectEdited } = get();
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
          const timestamp = Date.now();
          set(
            {
              model,
              trainModelDialogStage: model
                ? TrainModelDialogStage.Closed
                : TrainModelDialogStage.TrainingError,
              timestamp,
              ...updatedProject,
            },
            false,
            actionName
          );
          await storageWithErrHandling(() =>
            storage.updateMakeCodeProject(
              id,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
          return !trainingResult.error;
        },

        removeModel(): void {
          set({
            model: undefined,
          });
        },

        async resetProject(): Promise<void> {
          const {
            project: previousProject,
            actions,
            id,
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
          const timestamp = Date.now();
          set(
            {
              project: newProject,
              projectEdited: false,
              appEditNeedsFlushToEditor: true,
              timestamp,
            },
            false,
            "resetProject"
          );
          await storageWithErrHandling(() =>
            storage.updateMakeCodeProject(
              id,
              {
                project: newProject,
                projectEdited: false,
              },
              timestamp
            )
          );
        },

        async setProjectName(name: string): Promise<void> {
          const { id, project, projectEdited } = get();
          const updatedProject = renameProject(project, name);
          const timestamp = Date.now();
          set(
            {
              appEditNeedsFlushToEditor: true,
              project: updatedProject,
              timestamp,
            },
            false,
            "setProjectName"
          );
          await storageWithErrHandling(() =>
            storage.updateMakeCodeProject(
              id,
              {
                project: updatedProject,
                projectEdited,
              },
              timestamp
            )
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
          const { id, settings, timestamp, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          let updatedTimestamp = timestamp;
          let updatedProjectEdited = projectEdited;
          let newActions: ActionData[] | undefined;
          let importProject = false;
          let updateMakeCodeProject = false;
          const newProjectId = uuid();
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
                  updateMakeCodeProject = true;
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
                  importProject = true;
                  return {
                    id: newProjectId,
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
                updateMakeCodeProject = true;
                return {
                  project: newProject,
                  // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
                  projectEdited: updatedProjectEdited,
                };
              } else {
                // This lets us skip more pointless init-time edits.
                logging.log(
                  `[MakeCode] Edit ignored when closed. ID ${newProject.header?.id}`
                );
              }
              return state;
            },
            false,
            actionName
          );
          if (importProject) {
            projectSessionStorage.setProjectId(newProjectId);
            await storageWithErrHandling(() =>
              storage.importProject(
                newActions as ActionData[],
                {
                  project: newProject,
                  projectEdited: updatedProjectEdited,
                },
                { timestamp: updatedTimestamp, id: newProjectId },
                updatedSettings
              )
            );
          } else if (updateMakeCodeProject) {
            await storageWithErrHandling(() =>
              storage.updateMakeCodeProject(
                id,
                {
                  project: newProject,
                  projectEdited: updatedProjectEdited,
                },
                updatedTimestamp
              )
            );
          }
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
          const { actions, id, settings, tourState } = get();
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
            const timestamp = Date.now();
            const updatedState = {
              tourState: {
                ...tourSpec,
                index: 0,
              },
              settings: updatedSettings,
              timestamp,
            };
            set(updatedState);
            await storageWithErrHandling(() =>
              storage.updateSettings(id, updatedSettings, timestamp)
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
          const { id, settings } = get();
          const updatedSettings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, ...triggers])
            ),
          };
          const timestamp = Date.now();
          set({
            tourState: undefined,
            settings: updatedSettings,
            timestamp,
          });
          await storageWithErrHandling(() =>
            storage.updateSettings(id, updatedSettings, timestamp)
          );
        },

        async setDataSamplesView(view: DataSamplesView) {
          const { id, settings } = get();
          const updatedSettings = {
            ...settings,
            dataSamplesView: view,
          };
          const timestamp = Date.now();
          set({
            settings: updatedSettings,
            timestamp,
          });
          await storageWithErrHandling(() =>
            storage.updateSettings(id, updatedSettings, timestamp)
          );
        },
        async setShowGraphs(show: boolean) {
          const { id, settings } = get();
          const updatedSettings = {
            ...settings,
            showGraphs: show,
          };
          const timestamp = Date.now();
          set({
            settings: updatedSettings,
          });
          await storageWithErrHandling(() =>
            storage.updateSettings(id, updatedSettings, timestamp)
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
              classificationIds: actions.map((a) => a.id),
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

const loadModelFromStorage = async (id: string) => {
  const model = await storageWithErrHandling(
    () => storage.loadModel(id),
    false
  );
  if (model) {
    useStore.setState({ model }, false, "loadModel");
  }
};

useStore.subscribe(async (state, prevState) => {
  const { model: newModel, id: newId } = state;
  const { model: previousModel, id: prevId } = prevState;
  if (newModel !== previousModel) {
    if (!newModel && newId === prevId) {
      await storageWithErrHandling(() => storage.removeModel(newId), false);
      const message: BroadcastChannelData = {
        messageType: BroadcastChannelMessageType.REMOVE_MODEL,
        projectId: newId,
      };
      broadcastChannel.postMessage(message);
    } else if (newModel) {
      await storageWithErrHandling(
        () => storage.saveModel(newId, newModel),
        false
      );
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
  return migrateLegacyActionDataAndAssignNewIds(
    dataset.data as OldActionData[] | ActionData[]
  );
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
  callback: () => Promise<T>,
  broadcastEvent: boolean = true
) => {
  try {
    const value = await callback();
    if (broadcastEvent) {
      const message: BroadcastChannelData = {
        messageType: BroadcastChannelMessageType.RELOAD_PROJECT,
        projectId: useStore.getState().id,
      };
      broadcastChannel.postMessage(message);
    }
    return value;
  } catch (err) {
    // TODO: Add sensible error handling.
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("Storage quota exceeded!", err);
    } else if (err instanceof StorageError) {
      // We have failed to load an expected value from storage.
      console.error(err);
    } else {
      console.error(err);
    }
    // Throw for now to improve typing.
    throw err;
    // We can in theory set error state here with useStore.setState.
  }
};

export const loadProjectAndModelFromStorage = async (id: string) => {
  await useStore.getState().loadProjectFromStorage(id);
  await loadModelFromStorage(id);
  return true;
};

export const getAllProjectsFromStorage = async (): Promise<boolean> => {
  await useStore.getState().getAllProjectData();
  return true;
};

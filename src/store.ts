/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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
  ActionDataY,
  RecordingDatumY,
  XYZData,
  ActionDatumY,
  RecordingDataY,
} from "./model";
import { defaultSettings, Settings } from "./settings";
import { getTotalNumSamples, hasSufficientDataForTraining } from "./utils/actions";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { untitledProjectName } from "./project-name";
import { mlSettings } from "./mlConfig";
import { BufferedData } from "./buffered-data";
import { getDetectedAction } from "./utils/prediction";
import { getTour as getTourSpec } from "./tours";
import { createPromise, PromiseInfo } from "./hooks/use-promise-ref";
import { projectStorage } from "./store-persistence";
import * as Y from "yjs";

export const modelUrl = "indexeddb://micro:bit-ai-creator-model";

const createFirstAction = (actions: ActionDataY) => {
  const newAction = new Y.Map<string | number | Y.Array<RecordingDatumY>>();
  newAction.set("icon", defaultIcons[0]);
  newAction.set("ID", Date.now());
  newAction.set("name", "");
  newAction.set("recordings", new Y.Array<RecordingDatumY>());
  actions.push([newAction]);
};

export interface DataWindow {
  duration: number; // Duration of recording
  minSamples: number; // minimum number of samples for reliable detection (when detecting actions)
  deviceSamplesPeriod: number;
  deviceSamplesLength: number;
}

const legacyDataWindow: DataWindow = {
  duration: 1800,
  minSamples: 80,
  deviceSamplesPeriod: 25,
  deviceSamplesLength: 80,
};

// Exported for testing.
export const currentDataWindow: DataWindow = {
  duration: 990,
  minSamples: 44,
  deviceSamplesPeriod: 20, // Default value for accelerometer period.
  deviceSamplesLength: 50, // Number of samples required at 20 ms intervals for 1 second of data.
};

interface PredictionResult {
  confidences: Confidences;
  detected: Action | undefined;
}

const createUntitledProject = (): MakeCodeProject => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  header: {
    target: "microbit",
    targetVersion: "7.1.2",
    name: untitledProjectName,
    meta: {},
    editor: "blocksprj",
    pubId: "",
    pubCurrent: false,
    _rev: null,
    id: "45a3216b-e997-456c-bd4b-6550ddb81c4e",
    recentUse: 1726493314,
    modificationTime: 1726493314,
    cloudUserId: null,
    cloudCurrent: false,
    cloudVersion: null,
    cloudLastSyncTime: 0,
    isDeleted: false,
    githubCurrent: false,
    saveId: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  ...generateProject(
    untitledProjectName,
    { data: [] },
    undefined,
    currentDataWindow
  ),
});

const updateProject = (
  project: MakeCodeProject,
  projectEdited: boolean,
  actions: ActionDataY,
  model: tf.LayersModel | undefined,
  dataWindow: DataWindow
): Partial<Store> => {
  const actionsData = { data: actions.toJSON() };
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
  actions: ActionDataY;
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
  addNewAction(): void;
  addActionRecordings(id: ActionData["ID"], recs: RecordingData[]): void;
  deleteAction(id: ActionData["ID"]): void;
  setActionName(id: ActionData["ID"], name: string): void;
  setActionIcon(id: ActionData["ID"], icon: MakeCodeIcon): void;
  setRequiredConfidence(id: ActionData["ID"], value: number): void;
  deleteActionRecording(id: ActionData["ID"], recordingIdx: number): void;
  deleteAllActions(): void;
  downloadDataset(): void;

  dataCollectionMicrobitConnectionStart(options?: ConnectOptions): void;
  dataCollectionMicrobitConnected(): void;

  loadDataset(actions: ActionData[]): void;
  loadProject(project: MakeCodeProject, name: string): void;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(projectName?: string): void;
  trainModelFlowStart: (callback?: () => void) => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  setSettings(update: Partial<Settings>): void;
  setLanguage(languageId: string): void;

  /**
   * Resets the project.
   */
  resetProject(): void;
  /**
   * Sets the project name.
   */
  setProjectName(name: string): void;

  /**
   * When interacting outside of React to sync with MakeCode it's important to have
   * the current project after state changes.
   */
  getCurrentProject(): MakeCodeProject;
  checkIfProjectNeedsFlush(): boolean;
  checkIfLangChanged(): boolean;
  langChangeFlushedToEditor(): void;
  editorChange(project: MakeCodeProject): void;
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

  tourStart(trigger: TourTrigger, manual?: boolean): void;
  tourNext(): void;
  tourBack(): void;
  tourComplete(markCompleted: TourTriggerName[]): void;

  setPostConnectTourTrigger(trigger: TourTrigger | undefined): void;

  setDataSamplesView(view: DataSamplesView): void;
  setShowGraphs(show: boolean): void;

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
      persist(
        (set, get) => ({
          timestamp: undefined,
          actions: new Y.Array(),
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

          setSettings(update: Partial<Settings>) {
            set(
              ({ settings }) => ({
                settings: {
                  ...settings,
                  ...update,
                },
              }),
              false,
              "setSettings"
            );
          },

          setLanguage(languageId: string) {
            const currLanguageId = get().settings.languageId;
            if (languageId === currLanguageId) {
              // No need to update language if language is the same.
              // MakeCode does not reload.
              return;
            }
            set(
              ({ settings }) => ({
                settings: {
                  ...settings,
                  languageId,
                },
                editorPromises: {
                  editorReadyPromise: createPromise<void>(),
                  editorContentLoadedPromise: createPromise<void>(),
                },
                isEditorReady: false,
                editorStartUp: "in-progress",
                editorStartUpTimestamp: Date.now(),
                langChanged: true,
              }),
              false,
              "setLanguage"
            );
          },

          newSession(projectName?: string) {
            const untitledProject = createUntitledProject();
            set(
              {
                dataWindow: currentDataWindow,
                model: undefined,
                project: projectName
                  ? renameProject(untitledProject, projectName)
                  : untitledProject,
                projectEdited: false,
                appEditNeedsFlushToEditor: true,
                timestamp: Date.now(),
              },
              false,
              "newSession"
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

          addNewAction() {
            return set(({ project, actions, projectEdited, dataWindow }) => {
              const newAction = new Y.Map<string | number | Y.Array<RecordingDatumY>>();
              const existingIcons = actions.map(action => action.get("icon") as MakeCodeIcon);
              newAction.set("icon", actionIcon({
                isFirstAction: actions.length === 0,
                existingIcons,
              }));
              newAction.set("ID", Date.now());
              newAction.set("name", "");
              newAction.set("recordings", new Y.Array<Y.Map<number | XYZData>>());
              actions.push([newAction]);
              return {
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  undefined,
                  dataWindow
                ),
              };
            });
          },

          addActionRecordings(id: ActionData["ID"], recs: RecordingData[]) {
            const { actions } = get();
            for (const action of actions) {
              if (action.get("ID") === id) {
                const recsY = recs.map(rec => {
                  const recY = new Y.Map<number | XYZData>();
                  recY.set("ID", rec.ID);
                  recY.set("data", rec.data);
                  return recY;
                });
                (action.get("recordings") as Y.Array<RecordingDatumY>).push(recsY);
              }
            }
          },

          deleteAction(id: ActionData["ID"]) {
            const { actions } = get();
            withActionIndex(id, actions, (actionIndex) => {
              actions.delete(actionIndex)
            });
            if (actions.length === 0) {
              // TODO: Port this to Y mode
              createFirstAction(actions);
            }

            return set(({ project, projectEdited, actions, dataWindow }) => {
              const newDataWindow =
                actions.length === 0 ? currentDataWindow : dataWindow;
              return {
                dataWindow: newDataWindow,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  undefined,
                  newDataWindow
                ),
              };
            });
          },

          setActionName(id: ActionData["ID"], name: string) {
            const { actions } = get();
            withActionIndex(id, actions, (actionIndex) => {
              actions.get(actionIndex).set("name", name);
            });
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {

                return {
                  ...updateProject(
                    project,
                    projectEdited,
                    actions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          setActionIcon(id: ActionData["ID"], icon: MakeCodeIcon) {
            const { actions } = get();

            withActionIndex(id, actions, (actionIndex) => {
              const action = actions.get(actionIndex);
              const currentIcon = action.get("icon");
              action.set("icon", icon);
              actions.forEach((maybeClashingAction, maybeClashingActionIndex) => {
                if (maybeClashingActionIndex === actionIndex) {
                  return;
                }
                const maybeClashingIcon = maybeClashingAction.get("icon");
                if (maybeClashingIcon === icon) {
                  maybeClashingAction.set("icon", currentIcon!);
                }
              });
            });
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {
                // If we're changing the action to use an icon that's already in use
                // then we update the action that's using the icon to use the action's current icon

                return {
                  ...updateProject(
                    project,
                    projectEdited,
                    actions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          setRequiredConfidence(id: ActionData["ID"], value: number) {
            const { actions } = get();
            withActionIndex(id, actions, (actionIndex) => {
              actions.get(actionIndex).set("requiredConfidence", value);
            });
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {
                return {
                  ...updateProject(
                    project,
                    projectEdited,
                    actions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          deleteActionRecording(id: ActionData["ID"], recordingIdx: number) {
            const { actions } = get();
            let hasRecordings: boolean = false;
            for (const action of actions) {
              if (action.get("ID") === id) {
                (action.get("recordings") as RecordingDataY).delete(recordingIdx);
              } else {
                hasRecordings ||= (action.get("recordings") as RecordingDataY).length > 0;
              }
            }

            return set(({ project, projectEdited, actions, dataWindow }) => {
              const newDataWindow: DataWindow = hasRecordings ? currentDataWindow : dataWindow;
              return {
                dataWindow: newDataWindow,
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  undefined,
                  newDataWindow
                ),
              };
            });
          },

          deleteAllActions() {
            const { actions } = get();
            actions.delete(0, actions.length);
            return set(({ actions, project, projectEdited }) => ({
              dataWindow: currentDataWindow,
              model: undefined,
              ...updateProject(
                project,
                projectEdited,
                actions,
                undefined,
                currentDataWindow
              ),
            }));
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

          loadDataset(newActions: ActionData[]) {
            const { actions } = get();
            actions.delete(0, actions.length);
            let newActionsY: ActionDatumY[] = actionDataToY(newActions);

            actions.push(newActionsY);
            set(({ project, projectEdited, settings }) => {
              const dataWindow = getDataWindowFromActions(newActions);
              return {
                settings: {
                  ...settings,
                  toursCompleted: Array.from(
                    new Set([...settings.toursCompleted, "DataSamplesRecorded"])
                  ),
                },
                dataWindow,
                model: undefined,
                timestamp: Date.now(),
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  undefined,
                  dataWindow
                ),
              };
            });
          },

          /**
           * Generally project loads go via MakeCode as it reads the hex but when we open projects
           * from microbit.org we have the JSON already and use this route.
           */
          loadProject(project: MakeCodeProject, name: string) {
            const newActions = getActionsFromProject(project);
            set(({ settings, project: prevProject }) => {
              project = renameProject(project, name);
              project = {
                ...project,
                header: {
                  ...project.header!,
                  // .org projects have a partial header with no id which causes MakeCode sadness
                  id: project.header?.id ?? prevProject.header!.id,
                },
              };
              const timestamp = Date.now();
              return {
                settings: {
                  ...settings,
                  toursCompleted: Array.from(
                    new Set([...settings.toursCompleted, "DataSamplesRecorded"])
                  ),
                },
                dataWindow: getDataWindowFromActions(newActions),
                model: undefined,
                project,
                projectEdited: true,
                appEditNeedsFlushToEditor: true,
                timestamp,
                // We don't update projectLoadTimestamp here as we don't want a toast notification for .org import
              };
            });
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
            const { actions, dataWindow } = get();
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
              actions.toJSON(),
              dataWindow,
              (trainModelProgress) =>
                set({ trainModelProgress }, false, "trainModelProgress")
            );
            const model = trainingResult.error
              ? undefined
              : trainingResult.model;
            set(
              ({ project, projectEdited }) => ({
                model,
                trainModelDialogStage: model
                  ? TrainModelDialogStage.Closed
                  : TrainModelDialogStage.TrainingError,
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  model,
                  dataWindow
                ),
              }),
              false,
              actionName
            );
            return !trainingResult.error;
          },

          resetProject(): void {
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
                  { data: actions.toJSON() },
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
          },

          setProjectName(name: string): void {
            return set(
              ({ project }) => {
                return {
                  appEditNeedsFlushToEditor: true,
                  project: renameProject(project, name),
                };
              },
              false,
              "setProjectName"
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

          editorChange(newProject: MakeCodeProject) {
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
            set(
              (state) => {
                const {
                  project: prevProject,
                  isEditorOpen,
                  isEditorImportingState,
                  isEditorLoadingFile,
                  settings,
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
                    const timestamp = Date.now();
                    const newActions = getActionsFromProject(newProject);
                    return {
                      settings: {
                        ...settings,
                        toursCompleted: Array.from(
                          new Set([
                            ...settings.toursCompleted,
                            "DataSamplesRecorded",
                          ])
                        ),
                      },
                      project: newProject,
                      projectLoadTimestamp: timestamp,
                      timestamp,
                      // New project loaded externally so we can't know whether its edited.
                      projectEdited: true,
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
                }
                return state;
              },
              false,
              actionName
            );
          },
          setDownload(download: DownloadState) {
            set(
              { download, downloadFlashingProgress: 0 },
              false,
              "setDownload"
            );
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
            const { actions } = get();
            if (actions.length === 0) {
              createFirstAction(actions);
            }
            set(
              ({ actions, tourState, postConnectTourTrigger }) => {
                return {

                  // If a tour has been explicitly requested, do that.
                  // Other tours are triggered by callbacks or effects on the relevant page so they run only on the correct screen.
                  tourState: postConnectTourTrigger
                    ? {
                        index: 0,
                      ...getTourSpec(postConnectTourTrigger, actions.toJSON()),
                      }
                    : tourState,
                  postConnectTourTrigger: undefined,
                };
              },
              false,
              "dataCollectionMicrobitConnected"
            );
          },

          tourStart(trigger: TourTrigger, manual: boolean = false) {
            set((state) => {
              if (
                manual ||
                (!state.tourState &&
                  !state.settings.toursCompleted.includes(trigger.name))
              ) {
                const tourSpec = getTourSpec(trigger, state.actions.toJSON());
                const result = {
                  tourState: {
                    ...tourSpec,
                    index: 0,
                  },
                  // If manually triggered, filter out subsequent tours as they should run again too when reached
                  settings: manual
                    ? {
                        ...state.settings,
                        toursCompleted: state.settings.toursCompleted.filter(
                          (t) =>
                            tourSequence.indexOf(t) <=
                            tourSequence.indexOf(trigger.name)
                        ),
                      }
                    : state.settings,
                };
                return result;
              }
              return state;
            });
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
          tourComplete(triggers: TourTriggerName[]) {
            set(({ settings }) => ({
              tourState: undefined,
              settings: {
                ...settings,
                toursCompleted: Array.from(
                  new Set([...settings.toursCompleted, ...triggers])
                ),
              },
            }));
          },

          setDataSamplesView(view: DataSamplesView) {
            set(({ settings }) => ({
              settings: {
                ...settings,
                dataSamplesView: view,
              },
            }));
          },
          setShowGraphs(show: boolean) {
            set(({ settings }) => ({
              settings: {
                ...settings,
                showGraphs: show,
              },
            }));
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
                classificationIds: actions.map((a) => a.get("ID") as number),
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
                  )?.toJSON() as Action;
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

        {
          version: 1,
          name: "ml",
          partialize: ({
            actions,
            project,
            projectEdited,
            settings,
            timestamp,
          }) => ({
            actions,
            project,
            projectEdited,
            settings,
            timestamp,
            // The model itself is in IndexDB
          }),
          migrate(persistedStateUnknown, version) {
            switch (version) {
              case 0: {
                // We need to rename the "gestures" field to "actions"
                interface StateV0 extends Omit<State, "actions"> {
                  gestures?: ActionData[];
                }
                const stateV0 = persistedStateUnknown as StateV0;
                const { gestures, ...rest } = stateV0;

                // TODO: spicy problem as we can't see the Y.js actions from here
                //const newActions = actionDataToY(gestures as ActionData[]);
                //actions.delete(0, actions.length);
                //actions.push(newActions);

                return { ...rest } as State;
              }
              default:
                return persistedStateUnknown;
            }
          },
          merge(persistedStateUnknown, currentState) {
            // The zustand default merge does no validation either.
            const persistedState = persistedStateUnknown as State;
            return {
              ...currentState,
              ...persistedState,
              settings: {
                // Make sure we have any new settings defaulted
                ...defaultSettings,
                ...currentState.settings,
                ...persistedState?.settings,
              },
            };
          },
          storage: projectStorage(),
          skipHydration: true
        },
      ),
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

type UseSettingsReturn = [Settings, (settings: Partial<Settings>) => void];

const inContextTranslationLangId = "lol";

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
  existingIcons,
}: {
    isFirstAction: boolean;
    existingIcons: MakeCodeIcon[];
}) => {
  if (isFirstAction) {
    return defaultIcons[0];
  }
  const useableIcons: MakeCodeIcon[] = [];
  for (const icon of defaultIcons) {
    if (!existingIcons.includes(icon)) {
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

const withActionIndex = (actionID: number, actions: ActionDataY, cb: (actionIndex: number) => void) => {
  let actionIndex;
  for (actionIndex = 0; actionIndex < actions.length; ++actionIndex) {
    if (actions.get(actionIndex).get("ID") === actionID) {
      break;
    }
  }
  if (actionIndex === actions.length) return;
  cb(actionIndex);
}

const actionDataToY = (newActions: ActionData[]) => {
  let existingIcons: MakeCodeIcon[] = [];
  let newActionsY: ActionDatumY[] = [];
  for (const a of newActions) {
    const newActionY: ActionDatumY = new Y.Map();
    newActionY.set("ID", a.ID);
    newActionY.set("name", a.name);
    const newIcon = a.icon ? a.icon : actionIcon({ isFirstAction: false, existingIcons });
    existingIcons.push(newIcon);
    newActionY.set("icon", newIcon);
    newActionY.set("requiredConfidence", a.requiredConfidence as number); // TODO: consider undefined case
    const recordings: RecordingDatumY[] = [];
    for (const r of a.recordings) {
      const recordingY = new Y.Map() as RecordingDatumY;
      recordingY.set("ID", r.ID);
      recordingY.set("data", r.data);
      recordings.push(recordingY);
    }
    const recordingsY = new Y.Array() as RecordingDataY;
    recordingsY.push(recordings);
    newActionY.set("recordings", recordingsY);
    newActionsY.push(newActionY);
  }
  return newActionsY;
}

/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Project } from "@microbit/makecode-embed/react";
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
} from "./model";
import { defaultSettings, Settings } from "./settings";
import { getTotalNumSamples } from "./utils/actions";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { untitledProjectName } from "./project-name";
import { mlSettings } from "./mlConfig";
import { BufferedData } from "./buffered-data";
import { getDetectedAction } from "./utils/prediction";
import { getTour as getTourSpec } from "./tours";

export const modelUrl = "indexeddb://micro:bit-ai-creator-model";

const createFirstAction = () => ({
  icon: defaultIcons[0],
  ID: Date.now(),
  name: "",
  recordings: [],
});

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

const createUntitledProject = (): Project => ({
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
  project: Project,
  projectEdited: boolean,
  actions: ActionData[],
  model: tf.LayersModel | undefined,
  dataWindow: DataWindow
): Partial<Store> => {
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

  project: Project;
  /**
   * We use this for the UI to tell when we've switched new project,
   * e.g. to show a toast.
   */
  projectLoadTimestamp: number;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;
  changedHeaderExpected: boolean;
  appEditNeedsFlushToEditor: boolean;
  isEditorOpen: boolean;
  isEditorReady: boolean;
  editorStartUp: EditorStartUp;
  isEditorTimedOutDialogOpen: boolean;

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
  loadProject(project: Project, name: string): void;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(projectName?: string): void;
  trainModelFlowStart: (callback?: () => void) => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  setSettings(update: Partial<Settings>): void;

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
  getCurrentProject(): Project;
  checkIfProjectNeedsFlush(): boolean;
  editorChange(project: Project): void;
  editorReady(): void;
  editorTimedOut(): void;
  getEditorStartUp(): EditorStartUp;
  setIsEditorTimedOutDialogOpen(isOpen: boolean): void;
  setChangedHeaderExpected(): void;
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
}

type Store = State & Actions;

const createMlStore = (logging: Logging) => {
  return create<Store>()(
    devtools(
      persist(
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
          editorStartUp: "in-progress",
          isEditorTimedOutDialogOpen: false,
          appEditNeedsFlushToEditor: true,
          changedHeaderExpected: false,
          // This dialog flow spans two pages
          trainModelDialogStage: TrainModelDialogStage.Closed,
          trainModelProgress: 0,
          dataSamplesView: DataSamplesView.Graph,
          postImportDialogState: PostImportDialogState.None,
          predictionInterval: undefined,
          predictionResult: undefined,

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

          newSession(projectName?: string) {
            const untitledProject = createUntitledProject();
            set(
              {
                actions: [],
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
              ({ download, model }) => ({
                isEditorOpen: open,
                // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
                projectEdited: model ? true : false,
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
            return set(({ project, projectEdited, actions, dataWindow }) => {
              const newActions = [
                ...actions,
                {
                  icon: actionIcon({
                    isFirstAction: actions.length === 0,
                    existingActions: actions,
                  }),
                  ID: Date.now(),
                  name: "",
                  recordings: [],
                },
              ];
              return {
                actions: newActions,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newActions,
                  undefined,
                  dataWindow
                ),
              };
            });
          },

          addActionRecordings(id: ActionData["ID"], recs: RecordingData[]) {
            return set(({ actions }) => {
              const updatedActions = actions.map((action) => {
                if (action.ID === id) {
                  return {
                    ...action,
                    recordings: [...recs, ...action.recordings],
                  };
                }
                return action;
              });
              return {
                actions: updatedActions,
                model: undefined,
              };
            });
          },

          deleteAction(id: ActionData["ID"]) {
            return set(({ project, projectEdited, actions, dataWindow }) => {
              const newActions = actions.filter((a) => a.ID !== id);
              const newDataWindow =
                newActions.length === 0 ? currentDataWindow : dataWindow;
              return {
                actions:
                  newActions.length === 0 ? [createFirstAction()] : newActions,
                dataWindow: newDataWindow,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newActions,
                  undefined,
                  newDataWindow
                ),
              };
            });
          },

          setActionName(id: ActionData["ID"], name: string) {
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {
                const newActions = actions.map((action) =>
                  id !== action.ID ? action : { ...action, name }
                );
                return {
                  actions: newActions,
                  ...updateProject(
                    project,
                    projectEdited,
                    newActions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          setActionIcon(id: ActionData["ID"], icon: MakeCodeIcon) {
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {
                // If we're changing the action to use an icon that's already in use
                // then we update the action that's using the icon to use the action's current icon
                const currentIcon = actions.find((a) => a.ID === id)?.icon;
                const newActions = actions.map((action) => {
                  if (action.ID === id) {
                    return { ...action, icon };
                  } else if (
                    action.ID !== id &&
                    action.icon === icon &&
                    currentIcon
                  ) {
                    return { ...action, icon: currentIcon };
                  }
                  return action;
                });
                return {
                  actions: newActions,
                  ...updateProject(
                    project,
                    projectEdited,
                    newActions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          setRequiredConfidence(id: ActionData["ID"], value: number) {
            return set(
              ({ project, projectEdited, actions, model, dataWindow }) => {
                const newActions = actions.map((a) =>
                  id !== a.ID ? a : { ...a, requiredConfidence: value }
                );
                return {
                  actions: newActions,
                  ...updateProject(
                    project,
                    projectEdited,
                    newActions,
                    model,
                    dataWindow
                  ),
                };
              }
            );
          },

          deleteActionRecording(id: ActionData["ID"], recordingIdx: number) {
            return set(({ project, projectEdited, actions, dataWindow }) => {
              const newActions = actions.map((action) => {
                if (id !== action.ID) {
                  return action;
                }
                const recordings = action.recordings.filter(
                  (_r, i) => i !== recordingIdx
                );
                return { ...action, recordings };
              });
              const numRecordings = newActions.reduce(
                (acc, curr) => acc + curr.recordings.length,
                0
              );
              const newDataWindow =
                numRecordings === 0 ? currentDataWindow : dataWindow;
              return {
                actions: newActions,
                dataWindow: newDataWindow,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newActions,
                  undefined,
                  newDataWindow
                ),
              };
            });
          },

          deleteAllActions() {
            return set(({ project, projectEdited }) => ({
              actions: [createFirstAction()],
              dataWindow: currentDataWindow,
              model: undefined,
              ...updateProject(
                project,
                projectEdited,
                [],
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
            set(({ project, projectEdited, settings }) => {
              const dataWindow = getDataWindowFromActions(newActions);
              return {
                settings: {
                  ...settings,
                  toursCompleted: Array.from(
                    new Set([...settings.toursCompleted, "DataSamplesRecorded"])
                  ),
                },
                actions: (() => {
                  const copy = newActions.map((a) => ({ ...a }));
                  for (const a of copy) {
                    if (!a.icon) {
                      a.icon = actionIcon({
                        isFirstAction: false,
                        existingActions: copy,
                      });
                    }
                  }
                  return copy;
                })(),
                dataWindow,
                model: undefined,
                timestamp: Date.now(),
                ...updateProject(
                  project,
                  projectEdited,
                  newActions,
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
          loadProject(project: Project, name: string) {
            const newActions = getActionsFromProject(project);
            set(({ settings }) => {
              const timestamp = Date.now();
              return {
                settings: {
                  ...settings,
                  toursCompleted: Array.from(
                    new Set([...settings.toursCompleted, "DataSamplesRecorded"])
                  ),
                },
                actions: newActions,
                dataWindow: getDataWindowFromActions(newActions),
                model: undefined,
                project: renameProject(project, name),
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
              actions,
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

          editorChange(newProject: Project) {
            const actionName = "editorChange";
            set(
              (state) => {
                const {
                  project: prevProject,
                  isEditorOpen,
                  isEditorReady,
                  changedHeaderExpected,
                  settings,
                } = state;
                const newProjectHeader = newProject.header!.id;
                const previousProjectHeader = prevProject.header!.id;
                if (newProjectHeader !== previousProjectHeader) {
                  if (changedHeaderExpected) {
                    logging.log(
                      `[MakeCode] Detected new project, ignoring as expected due to import. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                    );
                    return {
                      changedHeaderExpected: false,
                      project: newProject,
                    };
                  }
                  if (isEditorReady) {
                    logging.log(
                      `[MakeCode] Detected new project, loading actions. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                    );
                    // It's a new project. Thanks user. We'll update our state.
                    // This will cause another write to MakeCode but that's OK as it gives us
                    // a chance to validate/update the project
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
                      actions: newActions,
                      dataWindow: getDataWindowFromActions(newActions),
                      model: undefined,
                      isEditorOpen: false,
                    };
                  } else {
                    // In particular, this happens if the MakeCode init completes after we've updated our project state from an import from .org
                    logging.log(
                      `[MakeCode] Ignoring changed ID before editor ready. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                    );
                  }
                } else if (isEditorOpen) {
                  logging.log(
                    `[MakeCode] Edit copied to project. ID ${newProject.header?.id}`
                  );
                  return {
                    project: newProject,
                  };
                } else {
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
          setChangedHeaderExpected() {
            set(
              { changedHeaderExpected: true },
              false,
              "setChangedHeaderExpected"
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
                  actions:
                    actions.length === 0 ? [createFirstAction()] : actions,

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

          tourStart(trigger: TourTrigger, manual: boolean = false) {
            set((state) => {
              if (
                manual ||
                (!state.tourState &&
                  !state.settings.toursCompleted.includes(trigger.name))
              ) {
                const tourSpec = getTourSpec(trigger, state.actions);
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
                return { actions: gestures, ...rest } as State;
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
                ...persistedState.settings,
              },
            };
          },
        }
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

// Get data window from actions on app load.
const { actions } = useStore.getState();
useStore.setState(
  { dataWindow: getDataWindowFromActions(actions) },
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

export const useSettings = (): UseSettingsReturn => {
  return useStore(useShallow((s) => [s.settings, s.setSettings]));
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

const getActionsFromProject = (project: Project): ActionData[] => {
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

const renameProject = (project: Project, name: string): Project => {
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

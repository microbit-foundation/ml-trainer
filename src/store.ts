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
import { trainModel } from "./ml";
import {
  DataSamplesView,
  DownloadState,
  DownloadStep,
  Gesture,
  GestureData,
  MicrobitToFlash,
  RecordingData,
  SaveState,
  SaveStep,
  TourId,
  TourState,
  TrainModelDialogStage,
} from "./model";
import { defaultProjectName } from "./project-name";
import { defaultSettings, Settings } from "./settings";
import { getTotalNumSamples } from "./utils/gestures";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";

export const modelUrl = "indexeddb://micro:bit-ai-creator-model";

const createFirstGesture = () => ({
  icon: defaultIcons[0],
  ID: Date.now(),
  name: "",
  recordings: [],
});

const createUntitledProject = (): Project => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  header: {
    target: "microbit",
    targetVersion: "7.1.2",
    name: defaultProjectName,
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
  ...generateProject("Untitled", { data: [] }, undefined),
});

const updateProject = (
  project: Project,
  projectEdited: boolean,
  gestures: GestureData[],
  model: tf.LayersModel | undefined
): Partial<Store> => {
  const gestureData = { data: gestures };
  const updatedProject = {
    ...project,
    text: {
      ...project.text,
      ...(projectEdited
        ? generateCustomFiles(gestureData, model, project)
        : generateProject(
            project.header?.name ?? "Untitled",
            gestureData,
            model
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
  gestures: GestureData[];
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

  download: DownloadState;
  downloadFlashingProgress: number;
  save: SaveState;

  settings: Settings;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;

  tourState?: TourState;
}

export interface Actions {
  addNewGesture(): void;
  addGestureRecordings(id: GestureData["ID"], recs: RecordingData[]): void;
  deleteGesture(id: GestureData["ID"]): void;
  setGestureName(id: GestureData["ID"], name: string): void;
  setGestureIcon(id: GestureData["ID"], icon: MakeCodeIcon): void;
  setRequiredConfidence(id: GestureData["ID"], value: number): void;
  deleteGestureRecording(
    gestureId: GestureData["ID"],
    recordingIdx: number
  ): void;
  deleteAllGestures(): void;
  downloadDataset(): void;
  dataCollectionMicrobitConnected(): void;
  loadDataset(gestures: GestureData[]): void;
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
  setChangedHeaderExpected(): void;
  projectFlushedToEditor(): void;

  setDownload(state: DownloadState): void;
  // TODO: does the persistence slow this down? we could move it to another store
  setDownloadFlashingProgress(value: number): void;
  setSave(state: SaveState): void;

  tourStart(tourId: TourId): void;
  tourNext(): void;
  tourBack(): void;
  tourComplete(id: TourId): void;

  setDataSamplesView(view: DataSamplesView): void;
}

type Store = State & Actions;

const createMlStore = (logging: Logging) => {
  return create<Store>()(
    devtools(
      persist(
        (set, get) => ({
          timestamp: undefined,
          gestures: [],
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
          appEditNeedsFlushToEditor: true,
          changedHeaderExpected: false,
          // This dialog flow spans two pages
          trainModelDialogStage: TrainModelDialogStage.Closed,
          trainModelProgress: 0,
          dataSamplesView: DataSamplesView.Graph,

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
                gestures: [],
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

          addNewGesture() {
            return set(({ project, projectEdited, gestures }) => {
              const newGestures = [
                ...gestures,
                {
                  icon: gestureIcon({
                    isFirstGesture: gestures.length === 0,
                    existingGestures: gestures,
                  }),
                  ID: Date.now(),
                  name: "",
                  recordings: [],
                },
              ];
              return {
                gestures: newGestures,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newGestures,
                  undefined
                ),
              };
            });
          },

          addGestureRecordings(id: GestureData["ID"], recs: RecordingData[]) {
            return set(({ gestures, settings: { toursCompleted } }) => {
              const updatedGestures = gestures.map((g) => {
                if (g.ID === id) {
                  return { ...g, recordings: [...recs, ...g.recordings] };
                }
                return g;
              });
              return {
                gestures: updatedGestures,
                model: undefined,
                tourState:
                  !toursCompleted.includes(TourId.CollectDataToTrainModel) &&
                  updatedGestures.length === 1 &&
                  updatedGestures[0].recordings.length === 1
                    ? { id: TourId.CollectDataToTrainModel, index: 0 }
                    : undefined,
              };
            });
          },

          deleteGesture(id: GestureData["ID"]) {
            return set(({ project, projectEdited, gestures }) => {
              const newGestures = gestures.filter((g) => g.ID !== id);
              return {
                gestures:
                  newGestures.length === 0
                    ? [createFirstGesture()]
                    : newGestures,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newGestures,
                  undefined
                ),
              };
            });
          },

          setGestureName(id: GestureData["ID"], name: string) {
            return set(({ project, projectEdited, gestures, model }) => {
              const newGestures = gestures.map((g) =>
                id !== g.ID ? g : { ...g, name }
              );
              return {
                gestures: newGestures,
                ...updateProject(project, projectEdited, newGestures, model),
              };
            });
          },

          setGestureIcon(id: GestureData["ID"], icon: MakeCodeIcon) {
            return set(({ project, projectEdited, gestures, model }) => {
              // If we're changing the `id` gesture to use an icon that's already in use
              // then we update the gesture that's using it to use the `id` gesture's current icon
              const currentIcon = gestures.find((g) => g.ID === id)?.icon;
              const newGestures = gestures.map((g) => {
                if (g.ID === id) {
                  return { ...g, icon };
                } else if (g.ID !== id && g.icon === icon && currentIcon) {
                  return { ...g, icon: currentIcon };
                }
                return g;
              });
              return {
                gestures: newGestures,
                ...updateProject(project, projectEdited, newGestures, model),
              };
            });
          },

          setRequiredConfidence(id: GestureData["ID"], value: number) {
            return set(({ project, projectEdited, gestures, model }) => {
              const newGestures = gestures.map((g) =>
                id !== g.ID ? g : { ...g, requiredConfidence: value }
              );
              return {
                gestures: newGestures,
                ...updateProject(project, projectEdited, newGestures, model),
              };
            });
          },

          deleteGestureRecording(id: GestureData["ID"], recordingIdx: number) {
            return set(({ project, projectEdited, gestures }) => {
              const newGestures = gestures.map((g) => {
                if (id !== g.ID) {
                  return g;
                }
                const recordings = g.recordings.filter(
                  (_r, i) => i !== recordingIdx
                );
                return { ...g, recordings };
              });

              return {
                gestures: newGestures,
                model: undefined,
                ...updateProject(
                  project,
                  projectEdited,
                  newGestures,
                  undefined
                ),
              };
            });
          },

          deleteAllGestures() {
            return set(({ project, projectEdited }) => ({
              gestures: [createFirstGesture()],
              model: undefined,
              ...updateProject(project, projectEdited, [], undefined),
            }));
          },

          downloadDataset() {
            const { gestures, project } = get();
            const a = document.createElement("a");
            a.setAttribute(
              "href",
              "data:application/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(gestures, null, 2))
            );
            a.setAttribute(
              "download",
              `${project.header?.name || "Untitled"}-data-samples`
            );
            a.style.display = "none";
            a.click();
          },

          loadDataset(newGestures: GestureData[]) {
            set(({ project, projectEdited }) => {
              return {
                gestures: (() => {
                  const copy = newGestures.map((g) => ({ ...g }));
                  for (const g of copy) {
                    if (!g.icon) {
                      g.icon = gestureIcon({
                        isFirstGesture: false,
                        existingGestures: copy,
                      });
                    }
                  }
                  return copy;
                })(),
                model: undefined,
                timestamp: Date.now(),
                ...updateProject(
                  project,
                  projectEdited,
                  newGestures,
                  undefined
                ),
              };
            });
          },

          /**
           * Generally project loads go via MakeCode as it reads the hex but when we open projects
           * from microbit.org we have the JSON already and use this route.
           */
          loadProject(project: Project, name: string) {
            set(() => {
              const timestamp = Date.now();
              return {
                gestures: getGesturesFromProject(project),
                model: undefined,
                project: renameProject(project, name),
                projectEdited: true,
                appEditNeedsFlushToEditor: true,
                timestamp,
                projectLoadTimestamp: timestamp,
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
              gestures,
              trainModel,
            } = get();
            if (!hasSufficientDataForTraining(gestures)) {
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
            const { gestures } = get();
            logging.event({
              type: "model-train",
              detail: {
                actions: gestures.length,
                samples: getTotalNumSamples(gestures),
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
            const trainingResult = await trainModel({
              data: gestures,
              onProgress: (trainModelProgress) =>
                set({ trainModelProgress }, false, "trainModelProgress"),
            });
            const model = trainingResult.error
              ? undefined
              : trainingResult.model;
            set(
              ({ project, projectEdited }) => ({
                model,
                trainModelDialogStage: model
                  ? TrainModelDialogStage.Closed
                  : TrainModelDialogStage.TrainingError,
                ...updateProject(project, projectEdited, gestures, model),
              }),
              false,
              actionName
            );
            return !trainingResult.error;
          },

          resetProject(): void {
            const { project: previousProject, gestures, model } = get();
            const newProject = {
              ...previousProject,
              text: {
                ...previousProject.text,
                ...generateProject("Untitled", { data: gestures }, model).text,
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

          editorChange(newProject: Project) {
            const actionName = "editorChange";
            set(
              (state) => {
                const {
                  project: prevProject,
                  isEditorOpen,
                  changedHeaderExpected,
                } = state;
                const newProjectHeader = newProject.header!.id;
                const previousProjectHeader = prevProject.header!.id;
                if (newProjectHeader !== previousProjectHeader) {
                  if (changedHeaderExpected) {
                    return {
                      changedHeaderExpected: false,
                      project: newProject,
                    };
                  }
                  console.log(
                    "Detected new project in MakeCode, loading gestures"
                  );
                  // It's a new project. Thanks user. We'll update our state.
                  // This will cause another write to MakeCode but that's OK as it gives us
                  // a chance to validate/update the project
                  const timestamp = Date.now();
                  return {
                    project: newProject,
                    projectLoadTimestamp: timestamp,
                    timestamp,
                    // New project loaded externally so we can't know whether its edited.
                    projectEdited: true,
                    gestures: getGesturesFromProject(newProject),
                    model: undefined,
                    isEditorOpen: false,
                  };
                } else if (isEditorOpen) {
                  return {
                    project: newProject,
                  };
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
          dataCollectionMicrobitConnected() {
            set(
              ({ gestures, tourState, settings }) => ({
                gestures:
                  gestures.length === 0 ? [createFirstGesture()] : gestures,
                tourState: settings.toursCompleted.includes(
                  TourId.DataSamplesPage
                )
                  ? tourState
                  : { id: TourId.DataSamplesPage, index: 0 },
              }),
              false,
              "dataCollectionMicrobitConnected"
            );
          },

          tourStart(tourId: TourId) {
            set((state) => {
              if (!state.settings.toursCompleted.includes(tourId)) {
                return { tourState: { id: tourId, index: 0 } };
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
          tourComplete(tourId: TourId) {
            set(({ settings }) => ({
              tourState: undefined,
              settings: {
                ...settings,
                toursCompleted: Array.from(
                  new Set([...settings.toursCompleted, tourId])
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
        }),
        {
          name: "ml",
          partialize: ({
            gestures,
            project,
            projectEdited,
            settings,
            timestamp,
          }) => ({
            gestures,
            project,
            projectEdited,
            settings,
            timestamp,
            // The model itself is in IndexDB
          }),
          merge(persistedStateUnknown, currentState) {
            // The zustand default merge does no validation either.
            const persistedState = persistedStateUnknown as Store;
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

export const useHasGestures = () => {
  const gestures = useStore((s) => s.gestures);
  return (
    (gestures.length > 0 && gestures[0].name.length > 0) ||
    gestures[0]?.recordings.length > 0
  );
};

const hasSufficientDataForTraining = (gestures: GestureData[]): boolean => {
  return (
    gestures.length >= 2 && gestures.every((g) => g.recordings.length >= 3)
  );
};

export const useHasSufficientDataForTraining = (): boolean => {
  const gestures = useStore((s) => s.gestures);
  return hasSufficientDataForTraining(gestures);
};

export const useHasNoStoredData = (): boolean => {
  const gestures = useStore((s) => s.gestures);
  return !(
    gestures.length !== 0 && gestures.some((g) => g.recordings.length > 0)
  );
};

type UseSettingsReturn = [Settings, (settings: Partial<Settings>) => void];

export const useSettings = (): UseSettingsReturn => {
  return useStore(useShallow((s) => [s.settings, s.setSettings]));
};

const gestureIcon = ({
  isFirstGesture,
  existingGestures,
}: {
  isFirstGesture: boolean;
  existingGestures: Gesture[];
}) => {
  if (isFirstGesture) {
    return defaultIcons[0];
  }
  const iconsInUse = existingGestures.map((g) => g.icon);
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

const getGesturesFromProject = (project: Project): GestureData[] => {
  const { text } = project;
  if (text === undefined || !("dataset.json" in text)) {
    return [];
  }
  const dataset = JSON.parse(text["dataset.json"]) as object;
  if (typeof dataset !== "object" || !("data" in dataset)) {
    return [];
  }
  return dataset.data as GestureData[];
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

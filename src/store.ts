import { Project } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { flags } from "./flags";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { trainModel } from "./ml";
import {
  DatasetEditorJsonFormat,
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
import { defaultSettings, Settings } from "./settings";
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
    name: "Untitled",
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
  ...generateProject({ data: [] }, undefined),
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
        : generateProject(gestureData, model).text),
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
  loadProject(project: Project): void;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(): void;
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
  setSave(state: SaveState): void;

  tourStart(tourId: TourId): void;
  tourNext(): void;
  tourBack(): void;
  tourComplete(id: TourId): void;
}

type Store = State & Actions;

export const useStore = create<Store>()(
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
          flashProgress: 0,
        },
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

        newSession() {
          set(
            {
              gestures: [],
              model: undefined,
              project: createUntitledProject(),
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
              // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
              projectEdited: true,
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
              ...updateProject(project, projectEdited, newGestures, undefined),
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
                newGestures.length === 0 ? [createFirstGesture()] : newGestures,
              model: undefined,
              ...updateProject(project, projectEdited, newGestures, undefined),
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
              ...updateProject(project, projectEdited, newGestures, undefined),
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
          const { gestures } = get();
          const a = document.createElement("a");
          a.setAttribute(
            "href",
            "data:application/json;charset=utf-8," +
              encodeURIComponent(JSON.stringify(gestures, null, 2))
          );
          a.setAttribute("download", "dataset");
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
              ...updateProject(project, projectEdited, newGestures, undefined),
            };
          });
        },

        loadProject(project: Project) {
          set(({ projectEdited, gestures: prevGestures }) => {
            const newGestures = getGesturesFromProject(project, prevGestures);
            return {
              gestures: newGestures,
              model: undefined,
              ...updateProject(project, projectEdited, newGestures, undefined),
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
          const actionName = "trainModel";
          set({
            trainModelDialogStage: TrainModelDialogStage.TrainingInProgress,
            trainModelProgress: 0,
          });
          const trainingResult = await trainModel({
            data: gestures,
            onProgress: (trainModelProgress) =>
              set({ trainModelProgress }, false, "trainModelProgress"),
          });
          const model = trainingResult.error ? undefined : trainingResult.model;
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
              ...generateProject({ data: gestures }, model).text,
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
              const pxtString = project.text?.[filenames.pxtJson];
              const pxt = JSON.parse(pxtString ?? "{}") as Record<
                string,
                unknown
              >;

              return {
                appEditNeedsFlushToEditor: true,
                project: {
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
                },
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
                const datasetString = newProject.text?.[filenames.datasetJson];
                const dataset = datasetString
                  ? (JSON.parse(datasetString) as DatasetEditorJsonFormat)
                  : { data: [] };

                return {
                  project: newProject,
                  projectLoadTimestamp: Date.now(),
                  // New project loaded externally so we can't know whether its edited.
                  projectEdited: true,
                  gestures: dataset.data,
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
          set({ download }, false, "setDownload");
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
            return { tourState: { ...tourState, index: tourState.index + 1 } };
          });
        },
        tourBack() {
          set(({ tourState }) => {
            if (!tourState) {
              throw new Error("No tour");
            }
            return { tourState: { ...tourState, index: tourState.index - 1 } };
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

const getGesturesFromProject = (
  project: Project,
  prevGestures: GestureData[]
): GestureData[] => {
  const { text } = project;
  if (text === undefined || !("dataset.json" in text)) {
    return prevGestures;
  }
  const dataset = JSON.parse(text["dataset.json"]) as object;
  if (typeof dataset !== "object" || !("data" in dataset)) {
    return prevGestures;
  }
  return dataset.data as GestureData[];
  //   {
  //     "header": {
  //         "target": "microbit",
  //         "targetVersion": "7.0.42",
  //         "editor": "blocksprj",
  //         "name": "Simple AI exercise timer",
  //         "meta": {},
  //         "pubId": "",
  //         "pubCurrent": false,
  //         "id": "f102d806-f767-45c6-3af3-35b3be9dbdcd",
  //         "recentUse": 1728049865,
  //         "modificationTime": 1728049865,
  //         "path": "Simple-AI-exercise-timer",
  //         "cloudCurrent": false,
  //         "saveId": null,
  //         "githubCurrent": false
  //     },
  //     "text": {
  //         "README.md": "",
  //         "autogenerated.ts": "// Auto-generated. Do not edit.\nnamespace ml {\n  export namespace event {\n      //% fixedInstance block=\"Exercising\"\n  export const Exercising = new MlEvent(2, \"Exercising\");\n  //% fixedInstance block=\"Not exercising\"\n  export const NotExercising = new MlEvent(3, \"Not exercising\");\n\n    }\n    \n  events = [event.Unknown,event.Exercising,event.NotExercising];\n    \n  control.onEvent(MlRunnerIds.MlRunnerInference, 1, () => {\n    if (!event.Unknown.onStartHandler) {\n      maybeUpdateEventStats(event.Unknown);\n    }\n  });\n  control.onEvent(MlRunnerIds.MlRunnerInference, 2, () => {\n    if (!event.Exercising.onStartHandler) {\n      maybeUpdateEventStats(event.Exercising);\n    }\n  });\n  control.onEvent(MlRunnerIds.MlRunnerInference, 3, () => {\n    if (!event.NotExercising.onStartHandler) {\n      maybeUpdateEventStats(event.NotExercising);\n    }\n  });\n\n  getModelBlob = (): Buffer => {\n    const result = hex`4C444F4D38001900500003000000000000000002CDCC4C3F0B45786572636973696E6700CDCC4C3F0F4E6F742065786572636973696E6700620F47304D4C3446500000002C0D0000A40500000000000000000000A80000000800000001000000080000000100000000000000000000000000000000000000180000000000000002000000000000002DE9F05F0F460169091839600021796038680346B3EC1E1A07F2080292EC010A20EE010A30EE210AA2EC010A92EC010A20EE020A30EE220AA2EC010A92EC010A20EE030A30EE230AA2EC010A92EC010A20EE040A30EE240AA2EC010A92EC010A20EE050A30EE250AA2EC010A92EC010A20EE060A30EE260AA2EC010A92EC010A20EE070A30EE270AA2EC010A92EC010A20EE080A30EE280AA2EC010A92EC010A20EE090A30EE290AA2EC010A92EC010A20EE0A0A30EE2A0AA2EC010A92EC010A20EE0B0A30EE2B0AA2EC010A92EC010A20EE0C0A30EE2C0AA2EC010A92EC010A20EE0D0A30EE2D0AA2EC010A92EC010A20EE0E0A30EE2E0AA2EC010A92EC010A20EE0F0A30EE2F0AA2EC010A02F22402B3EC121A07F2440292EC010A20EE010A30EE210AA2EC010A92EC010A20EE020A30EE220AA2EC010A92EC010A20EE030A30EE230AA2EC010A92EC010A20EE040A30EE240AA2EC010A92EC010A20EE050A30EE250AA2EC010A92EC010A20EE060A30EE260AA2EC010A92EC010A20EE070A30EE270AA2EC010A92EC010A20EE080A30EE280AA2EC010A92EC010A20EE090A30EE290AA2EC010A02F23C02386800F2C00307F268021024B3EC010A07F20801F1EC0E0AF3EC0E7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A65EEAC5A30EE050A26EE0D6A30EE250A66EEAD6A30EE060A27EE0E7A30EE260A30EE070AF1EC0A0AF3EC0A7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A30EE050AA2EC010A013C8FD107F2680210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C2386800F2007307F208020224B3EC010A07F26801F1EC0E0AF3EC0E7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A65EEAC5A30EE050A26EE0D6A30EE250A66EEAD6A30EE060A27EE0E7A30EE260A30EE070AF1EC020AF3EC027A60EEA70A21EE081A30EE200A30EE010AA2EC010A013CAFD107F208021046022100F002F8BDE8F09F012938B5D0ED002A29D9031D00EB8102F3EC017AF4EE627AF1EE10FAC8BFF0EE672A9A42F4D1002402EE104A054695ED000A30EE620A00F015F80134A14232EE002AA5EC010AF2D8002390ED007AC7EE027A01339942E0EC017AF6D838BD0029E1D138BDDFED297AB4EEE70AF1EE10FA48D4DFED277AB4EEE70AF1EE10FA3ADCDFED247ADFED244A9FED243ADFED243A9FED245A9FED244ADFED245A9FED246ADFED246A60EE277AB7EE007A77EEA47A77EEE47AA7EE830AFDEEE74AA7EEA30AF0EE457AE4EE007A14EE903AE7EE805AA5EE806AE6EE006AF0EE667AF0EE476AE7EE806AA6EE807A17EE102A02EBC35300EE103A7047DFED107AB7EE007A87EE270A70479FED0C0A704700000000AAC20000AE423BAAB83F0000404B007231BF8EBEBFB56E2F093C00A0B43AADAD2A3D28AA2A3EFBFFFF3E0000000059D0953F799026BD2B527B3F93FA7DBECD01913F2730F7BE80DEAE3FB32EDC3E7829A33FB4147A3EFB59A93F5EC956BEBE2B863F6135183F9FF8833F0CB5253F84D6903F9567DA3E6C5CD83FE25994BEAFB6B23FFCBCB7BE45C5AF3F5613BABE20C41F3FF7BD2FBF4E9F023F322A36BF6C53263FBC4959BF39A3EB3C7B329CBFC1E4393D4826DEBF3547223D68007BBF31AFC63FBA16C6BBF4CAC83F6CEDB0BCADFAB83F21358BBDD8E8B23F142A17BF15D1AD3F4F6D31BF8947AB3F87CFD2BE973C4BBC6780D5BD8F1A80BE41A5B0BDE8EFE43DC20F303E8E232BBCFFF501BD0068F4BB4496293D8BB6683E26351D3EA94792BE3FC12EBD42622DBEA1BF40BE7233D6BEC03DF8BDA5779CBD25EB643EB1289D3D05429D3DA4F0C5BE0A83923EF21CA53C22E35A3D8477C0BE68365BBEEA5419BEF32C2FBC56B15F3EB9C991BE33DFB4BEA0220D3EEECF87BEBEEDD6BED46DABBE9F0686BE1DA4F83CF598973C9AF70BBFBB1785BE43AA43BC2E3CA4BE84068A3E29DB37BE34A20C3E37D702BED7F704BE27040E3E34AC90B9AA24BB3DD51308BE6477993D18CB03BE0506C0BEA83CB23EFDDF6CBE0E32243EB8E3D53D78FFD7BDD518B13EF43858BCCF02243E50F610BE4388FCBC5539D03D9B23B5BD3AF8103EC53B843E81B6A43EAEE7ADBE9C0636BE992A85BEC342633EB7318CBD2BB9873E658A66BDD23CB1BE4EFA36BEC0D19EBEB5884D3EBAC9CEBD0CEC83BEBFB2BDBD5A9C56BC1176B2BE7C8EFEBD06EC853EC37F15BE3B991EBE17A814BD79A041BE8BB93C3DD76E53BEEA724E3E884D4F3EBC417BBEDA9A863CF0F455BE7E80C93CCFB8A5BEF7D18A3DC1FA543EEFA34D3E75DDCC3D7D55B73D6073543D0531F0BD3B2E803EE467113DD2F5C53EFDE8A7BD05ACEA3A902CAB3EBFC47A3E7412E03EC852EA3E9D9EF43D131B8D3D5A01A33DC4F7F3BD74A234BEC42D223EFAAEC9BEDA87AA3CE621E53DE31DFB3D2B9F38BE5C433F3E398A8A3E799C8BBE41A084BD5801EBBE137AF9BE9CC6E9BD642991BEC4B9433EEED8A23C802CD3BD4110A23E6F60A43DCC1D0B3E957412BD2AB9953E9FD6A43EEA9974BC55735E3C08C449BE708FED3D99CE5F3DE623B53EDC098CBEDF5BCB3D67F317BEC25A113DB80498BE996E45BD4A6AC7BD3862313E9B628C3E9D72A73E54FA133EA9D7E5BD6CB60C3F0B573B3E119C9EBEEEB0ECBDBFDF0ABD8E18533D49E12DBC1326A53CE0A6C03E742CBABE9FFC92BDA99A9D3DF4EC39BDEDF04A3ECD301ABE314151BE1F0ADCBC95B119BEB9B08EBEECD888BE3A76DEBD4C5D3F3D53F954BE96EAAA3D0D96AB3C4BBB633E0B2BAC3D9800C73D7F9D123D5E13853EB96CCABDAFAB0FBEB68639BE4D1D243E1775BEBD7C39873E3C5E4D3C953E53BE97996ABE719CA0BE3B3FAE3E8874873EAAEFF4BA59B59E3C09473B3C1FC82DBDB2476ABEA6636EBE07F675BEFAC74B3ED2948EBD469156BD2E9F7CBEB42D8B3DDE110FBE5A0F3ABE848580BE6DC6613D364796BDF03B5EBEF29B52BE5A97B93D513B2ABD4996073E7F4F57BEAEB7773E2527AEBD2691123E490AF2BBA593C43D50EB6A3D8269DBBE26E290BE6BB64BBEEE2F92BE4C9A08BD499FAFBE1EE773BE5B9C7B3E5A0968BEBDD4FBBDFACE9ABDCE0822BEAE10473DC49400BE78A3833C9BD6CA3CAC86AABD9B6E9C3ECB8B103EED21BEBEFB0D323DD37300BE156851BCCB6DBC3E34A7DA3D5FC2B53E2FEE48BEA192E4BB19FA20BD1E91C8BD8CA151BE0800D5BE4C667DBDA32CBFBB1EEF793EAD567E3E76BCBC3D7511933EF1B2883E754E223EFE74593C049DFB3CFA97123D61FC8A3ECA815C3E8A42383EA9528A3D2EC4A9BE868E78BB18CFF6BD52E1493DCAF0653DEF5C45BEC51B123D6CAA81BECDD53BBD7C08ED3D8114C03EB8A66BBD7B60993E631C673DF53F0E3DB59DC03C4C4021BE34BB4F3ECFB810BDED7A5ABEF9B40F3D70F9E3BEDF24023D0B83533D1DA8553D7A048CBE1E75C43CEBF4C03DE6C991BE712D3CBE517E3E3E92B4303D63BACC3DD39D553D7614173E30C8843ECA75373D140A193DB1CF863E9F74CE3DCB09973DC04FBB3E299D173E86F5793DAAE9533D0903EC3D3E896DBD61C387BE196ACBBEAB19B43E355C5ABE69774F3D751239BEF7939B3AF9006E3E8E7E3ABDB53CD63D50A500BEE566503EDBE856BEB2181FBDE7D65F3E8548D73E9B13BE3E4966373E731B123E6E79593E524B1D3E817E333D5DF460BEDC2866BC7CE467BEC07094BCEC1FACBE0B8831BE4D4BBDBB702E0F3ED2F49C3D3F8D82BE690FFF3D04AC22BC00D1F8BC3FE270BD6897ACBEBFC419BEE408A03D2CF3DFBCF730443D124B66BE455C5CBEC7A289BD2836EC3CF5A7363D22B9583ED6B0D1BD66ECF73D3A57253D6C9211BFD88874BECC6A85BE6DCE07BF7079E4BD1AD1C4BB7C6CFE3E59653E3E8F7FA9BEF973AB3DF728023D00AE253E153A8E3D18EDA33E99DFEEBEC97051BEEA32433E29B71F3EBC51C03EEDD8703EBFAEB3BE9EF7EE3D9E72FCBE5CB6B9BEDB567D3EA24C4E3CB34F893E41F52C3E9FEF053F194FD6BD482EDBBDB721C2BEA8C568BECA3E41BEA61E04BEDBFD8B3E7403F9BE3E952C3F9EF7EEBD721B8DBE8192D93E16E0A53D59A37A3EDBB7A8BDF99484BE197950BE13CC13BFB57C0A3FD476173F92FEEABE7848F5BE1195B7BD2AA7F5BEAF53383ECE043EBF00000000`;\n    return result;\n  };\n\n  simulatorSendData();\n}\n\n// Auto-generated. Do not edit. Really.\n",
  //         "dataset.json": "{\n  \"data\": [\n    {\n      \"icon\": \"StickFigure\",\n      \"ID\": 1727272450006,\n      \"name\": \"Exercising\",\n      \"recordings\": [\n        {\n          \"ID\": 1727272665334,\n          \"data\": {\n            \"x\": [\n              -1.064,\n              -0.952,\n              -0.776,\n              -0.692,\n              -0.984,\n              -1.172,\n              -1.18,\n              -1.396,\n              -1.876,\n              -1.86,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.964,\n              -1.664,\n              -1.4,\n              -1.096,\n              -0.868,\n              -0.716,\n              -0.688,\n              -0.692,\n              -0.704,\n              -0.716,\n              -0.72,\n              -0.772,\n              -0.884,\n              -0.944,\n              -0.836,\n              -0.74,\n              -0.716,\n              -0.8,\n              -1.008,\n              -0.976,\n              -0.86,\n              -0.932,\n              -0.992,\n              -1.024,\n              -0.984,\n              -1.292,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.896,\n              -1.564,\n              -1.232,\n              -0.964,\n              -0.836,\n              -0.764,\n              -0.768,\n              -0.812,\n              -0.892,\n              -1.024,\n              -1.132,\n              -1.22,\n              -1.248,\n              -1.328,\n              -1.236,\n              -1.16,\n              -0.96,\n              -0.852,\n              -0.856,\n              -1.064,\n              -1.236,\n              -1.34,\n              -1.676,\n              -2.04,\n              -2.04,\n              -2.04\n            ],\n            \"y\": [\n              0.528,\n              0.392,\n              0.312,\n              0.32,\n              0.112,\n              -0.292,\n              -0.472,\n              -0.668,\n              -1.148,\n              -1.38,\n              -1.604,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.86,\n              -1.912,\n              -1.788,\n              -1.732,\n              -1.768,\n              -1.88,\n              -1.552,\n              -1.196,\n              -0.748,\n              -0.296,\n              -0.228,\n              -0.208,\n              -0.116,\n              -0.036,\n              0.048,\n              0.148,\n              0.244,\n              0.288,\n              0.272,\n              0.236,\n              0.228,\n              0.232,\n              0.24,\n              0.312,\n              0.444,\n              0.512,\n              0.512,\n              0.512,\n              0.316,\n              -0.052,\n              -0.108,\n              0.056,\n              -0.484,\n              -1.408,\n              -2.032,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.936,\n              -2.04,\n              -1.864,\n              -1.52,\n              -1.148,\n              -0.72,\n              -0.472,\n              -0.336,\n              -0.328,\n              -0.26,\n              -0.132,\n              0.064,\n              0.272,\n              0.608,\n              0.824,\n              0.548,\n              0.424,\n              0.584,\n              0.672,\n              0.552,\n              0.172,\n              -0.028,\n              -0.084,\n              -0.128,\n              -0.14,\n              -0.284,\n              -0.468,\n              -0.68,\n              -1.072\n            ],\n            \"z\": [\n              0.436,\n              0.308,\n              0.184,\n              0.228,\n              0.392,\n              0.26,\n              0.072,\n              -0.328,\n              -0.152,\n              -0.232,\n              -0.164,\n              -0.02,\n              -0.172,\n              -0.648,\n              -0.728,\n              -0.7,\n              -0.308,\n              -0.016,\n              0.176,\n              0.328,\n              0.672,\n              0.92,\n              1.192,\n              1.384,\n              1.456,\n              1.348,\n              1.196,\n              1.064,\n              0.9,\n              0.812,\n              0.748,\n              0.716,\n              0.704,\n              0.672,\n              0.628,\n              0.544,\n              0.48,\n              0.448,\n              0.424,\n              0.404,\n              0.352,\n              0.336,\n              0.276,\n              0.304,\n              0.316,\n              0.168,\n              -0.112,\n              -0.156,\n              0.044,\n              -0.132,\n              -0.284,\n              -0.58,\n              -0.192,\n              -0.272,\n              -0.844,\n              -0.896,\n              -0.588,\n              -0.064,\n              0.38,\n              0.352,\n              0.904,\n              1.408,\n              1.74,\n              1.808,\n              1.636,\n              1.46,\n              1.24,\n              1.024,\n              0.816,\n              0.668,\n              0.572,\n              0.676,\n              0.804,\n              0.92,\n              0.98,\n              0.932,\n              0.708,\n              0.72,\n              0.708,\n              0.652,\n              0.46,\n              0.184,\n              -0.14,\n              -0.2,\n              -0.324,\n              -0.448,\n              -0.468,\n              -0.46,\n              -0.532\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272658417,\n          \"data\": {\n            \"x\": [\n              0.268,\n              0.236,\n              0.096,\n              0.016,\n              -0.096,\n              -0.144,\n              -0.164,\n              -0.532,\n              -0.936,\n              -2.04,\n              -1.244,\n              -0.868,\n              -1.42,\n              -1.308,\n              -0.616,\n              -0.256,\n              0.068,\n              0.444,\n              0.628,\n              0.984,\n              1.052,\n              0.984,\n              1.028,\n              0.916,\n              0.62,\n              0.62,\n              0.2,\n              -0.432,\n              -1.3,\n              -2.04,\n              -1.144,\n              -1.312,\n              -1.024,\n              -0.812,\n              -0.668,\n              -0.16,\n              0.328,\n              0.448,\n              0.668,\n              1.396,\n              0.936,\n              0.952,\n              1.052,\n              1.04,\n              0.596,\n              0.24,\n              0.164,\n              -0.244,\n              -0.512,\n              -1.288,\n              -1.728,\n              -1.628,\n              -1.616,\n              -0.792,\n              -0.612,\n              -0.088,\n              0.388,\n              0.648,\n              1.008,\n              1.612,\n              0.372,\n              1.26,\n              0.38,\n              1.216,\n              0.496,\n              0.264,\n              0.04,\n              0.12,\n              -0.024,\n              -0.52,\n              -1.8,\n              -1.672,\n              -0.904,\n              -0.484,\n              -0.448,\n              -0.108,\n              0.232,\n              0.36,\n              0.42,\n              0.288,\n              1.02,\n              0.472,\n              0.696,\n              0.376,\n              0.208,\n              0.064,\n              -0.18,\n              -0.26\n            ],\n            \"y\": [\n              1.152,\n              1.676,\n              0.884,\n              0.636,\n              0.012,\n              -0.268,\n              -0.564,\n              -1.352,\n              -1.904,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.68,\n              -0.992,\n              -0.528,\n              -0.08,\n              0.896,\n              1.16,\n              1.356,\n              0.388,\n              0.348,\n              0.088,\n              -0.172,\n              -0.464,\n              -1.12,\n              -2.04,\n              -2.016,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.888,\n              -1.116,\n              -0.644,\n              -0.396,\n              0.168,\n              0.924,\n              1.304,\n              1.872,\n              0.444,\n              0.468,\n              0.196,\n              0.644,\n              0.332,\n              -0.332,\n              -1.128,\n              -1.444,\n              -1.928,\n              -1.584,\n              -2.04,\n              -2.04,\n              -1.304,\n              -0.416,\n              0.132,\n              0.028,\n              0.292,\n              0.804,\n              0.984,\n              1.64,\n              1.848,\n              1.92,\n              0.608,\n              1.052,\n              0.344,\n              -0.192,\n              -1.22,\n              -1.6,\n              -1.644,\n              -1.364,\n              -1.764,\n              -2.04,\n              -2.04,\n              -1.192,\n              -0.436,\n              -0.468,\n              -0.532,\n              -0.272,\n              0.096,\n              0.592,\n              0.656,\n              0.5,\n              0.156,\n              -0.716,\n              -0.936,\n              -0.896,\n              -0.936,\n              -0.548\n            ],\n            \"z\": [\n              2.04,\n              1.74,\n              1.704,\n              1.532,\n              1.112,\n              0.944,\n              0.496,\n              0.008,\n              0.78,\n              1.056,\n              -0.548,\n              -1.228,\n              -1.08,\n              -0.348,\n              -0.432,\n              -0.14,\n              0.496,\n              1.432,\n              2.04,\n              2.04,\n              1.996,\n              1.836,\n              2.04,\n              2.024,\n              1.496,\n              0.336,\n              -0.472,\n              -0.58,\n              0.524,\n              0.196,\n              -1.928,\n              -1.62,\n              -0.992,\n              -0.468,\n              0.032,\n              0.572,\n              1.536,\n              2.04,\n              2.04,\n              1.6,\n              1.58,\n              2.04,\n              2.04,\n              2.04,\n              1.768,\n              1.388,\n              0.34,\n              -0.444,\n              -0.592,\n              1.776,\n              0.04,\n              -1.116,\n              -1.068,\n              -0.876,\n              -0.48,\n              0.052,\n              0.44,\n              1.772,\n              2.04,\n              2.04,\n              0.94,\n              -0.36,\n              1.66,\n              2.04,\n              2.04,\n              2.04,\n              1.916,\n              0.824,\n              0.492,\n              1.104,\n              0.248,\n              -1.712,\n              -1.664,\n              -1.436,\n              -0.88,\n              -0.372,\n              0.288,\n              1.028,\n              1.812,\n              2.04,\n              2.04,\n              2.04,\n              2.04,\n              2.04,\n              2.04,\n              1.964,\n              1.388,\n              0.66\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272638820,\n          \"data\": {\n            \"x\": [\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.82,\n              -1.552,\n              -1.416,\n              -1.34,\n              -1.26,\n              -1.196,\n              -1.164,\n              -1.096,\n              -1.004,\n              -0.924,\n              -0.84,\n              -0.772,\n              -0.768,\n              -0.916,\n              -0.952,\n              -1.144,\n              -1.352,\n              -1.72,\n              -1.984,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.912,\n              -1.696,\n              -1.472,\n              -1.296,\n              -1.08,\n              -0.856,\n              -0.648,\n              -0.504,\n              -0.512,\n              -0.496,\n              -0.476,\n              -0.484,\n              -0.504,\n              -0.54,\n              -0.608,\n              -0.708,\n              -0.904,\n              -1.324,\n              -1.804,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.876,\n              -1.64,\n              -1.484,\n              -1.292,\n              -1.14,\n              -0.976,\n              -0.868,\n              -0.788,\n              -0.712,\n              -0.672,\n              -0.66,\n              -0.644,\n              -0.816,\n              -0.916,\n              -0.996,\n              -1.14,\n              -1.284,\n              -1.416,\n              -1.54,\n              -1.736,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04\n            ],\n            \"y\": [\n              -0.444,\n              -0.536,\n              -0.504,\n              -0.408,\n              -0.572,\n              -0.752,\n              -0.94,\n              -0.868,\n              -0.456,\n              -0.296,\n              -0.276,\n              -0.344,\n              -0.4,\n              -0.488,\n              -0.544,\n              -0.584,\n              -0.608,\n              -0.64,\n              -0.74,\n              -0.984,\n              -1.096,\n              -1.076,\n              -0.92,\n              -0.864,\n              -0.784,\n              -0.688,\n              -0.572,\n              -0.432,\n              -0.252,\n              -0.132,\n              -0.068,\n              -0.092,\n              -0.036,\n              -0.056,\n              -0.116,\n              -0.172,\n              -0.12,\n              -0.112,\n              0.012,\n              0.036,\n              0.196,\n              0.34,\n              0.4,\n              0.34,\n              0.328,\n              0.34,\n              0.288,\n              0.184,\n              0.096,\n              0.024,\n              0.024,\n              0.02,\n              0.02,\n              -0.064,\n              -0.112,\n              -0.208,\n              -0.336,\n              -0.384,\n              -0.5,\n              -0.712,\n              -0.984,\n              -0.944,\n              -0.832,\n              -0.656,\n              -0.512,\n              -0.464,\n              -0.484,\n              -0.472,\n              -0.452,\n              -0.448,\n              -0.468,\n              -0.536,\n              -0.688,\n              -0.884,\n              -0.916,\n              -0.912,\n              -0.896,\n              -0.768,\n              -0.632,\n              -0.492,\n              -0.36,\n              -0.28,\n              -0.292,\n              -0.336,\n              -0.36,\n              -0.332,\n              -0.216,\n              -0.384\n            ],\n            \"z\": [\n              0.712,\n              0.676,\n              0.748,\n              0.712,\n              0.636,\n              0.428,\n              0.172,\n              0.296,\n              0.068,\n              -0.02,\n              -0.044,\n              -0.032,\n              0.016,\n              0.052,\n              0.092,\n              0.056,\n              0,\n              -0.028,\n              -0.128,\n              -0.276,\n              -0.288,\n              -0.292,\n              -0.308,\n              -0.22,\n              -0.116,\n              -0.064,\n              -0.012,\n              0.028,\n              0.004,\n              -0.056,\n              -0.02,\n              0.12,\n              0.128,\n              0.096,\n              0.128,\n              0.168,\n              0.16,\n              0.144,\n              0.072,\n              0.096,\n              0.028,\n              -0.04,\n              -0.068,\n              -0.08,\n              -0.032,\n              -0.02,\n              -0.008,\n              -0.048,\n              -0.076,\n              -0.108,\n              -0.112,\n              -0.072,\n              -0.044,\n              0.052,\n              0.112,\n              0.272,\n              0.388,\n              0.46,\n              0.464,\n              0.28,\n              0.256,\n              0.16,\n              0.24,\n              0.236,\n              0.2,\n              0.192,\n              0.188,\n              0.136,\n              -0.004,\n              -0.024,\n              -0.048,\n              -0.092,\n              -0.128,\n              -0.228,\n              -0.176,\n              -0.172,\n              -0.1,\n              -0.06,\n              -0.028,\n              -0.064,\n              -0.06,\n              -0.036,\n              -0.024,\n              0.044,\n              0.056,\n              0.168,\n              0.16,\n              0.172\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272603693,\n          \"data\": {\n            \"x\": [\n              -1.144,\n              -0.948,\n              -0.888,\n              -0.82,\n              -0.74,\n              -0.768,\n              -0.924,\n              -1.196,\n              -1.48,\n              -1.324,\n              -1.044,\n              -0.796,\n              -0.668,\n              -0.504,\n              -0.356,\n              -0.188,\n              -0.008,\n              0.244,\n              0.508,\n              0.6,\n              0.5,\n              0.388,\n              0.292,\n              0.124,\n              -0.164,\n              -0.404,\n              -0.868,\n              -1.356,\n              -1.556,\n              -1.62,\n              -1.348,\n              -1.216,\n              -1.02,\n              -0.956,\n              -0.944,\n              -0.872,\n              -0.84,\n              -0.776,\n              -0.752,\n              -0.812,\n              -0.956,\n              -1.072,\n              -1.316,\n              -1.632,\n              -1.84,\n              -1.756,\n              -1.42,\n              -1.076,\n              -0.868,\n              -0.684,\n              -0.508,\n              -0.268,\n              -0.052,\n              0.176,\n              0.336,\n              0.376,\n              0.26,\n              0.128,\n              -0.024,\n              -0.216,\n              -0.48,\n              -0.792,\n              -0.904,\n              -1.16,\n              -1.276,\n              -1.276,\n              -1.228,\n              -1.16,\n              -1.28,\n              -1.364,\n              -1.08,\n              -0.924,\n              -0.856,\n              -0.876,\n              -0.984,\n              -0.996,\n              -1.052,\n              -1.492,\n              -1.66,\n              -1.424,\n              -2.04,\n              -1.744,\n              -1.22,\n              -0.74,\n              -0.424,\n              -0.196,\n              0.016,\n              0.256,\n              0.52\n            ],\n            \"y\": [\n              -0.24,\n              0.188,\n              0.496,\n              0.448,\n              0.184,\n              -0.128,\n              -0.492,\n              -0.964,\n              -1.396,\n              -1.644,\n              -1.756,\n              -1.708,\n              -1.728,\n              -1.672,\n              -1.368,\n              -1.132,\n              -1,\n              -0.904,\n              -1.028,\n              -1.112,\n              -1.092,\n              -0.992,\n              -0.88,\n              -0.952,\n              -1.16,\n              -1.532,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.032,\n              -1.412,\n              -0.936,\n              -0.596,\n              -0.452,\n              -0.348,\n              -0.276,\n              -0.144,\n              0.128,\n              0.352,\n              0.316,\n              0.1,\n              -0.064,\n              -0.34,\n              -0.9,\n              -1.452,\n              -1.712,\n              -1.732,\n              -1.504,\n              -1.352,\n              -1.368,\n              -1.288,\n              -1.132,\n              -0.988,\n              -0.908,\n              -0.928,\n              -0.888,\n              -0.912,\n              -1.008,\n              -1.168,\n              -1.288,\n              -1.412,\n              -1.548,\n              -1.74,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.724,\n              -1.056,\n              -0.38,\n              0.032,\n              0.292,\n              0.496,\n              0.632,\n              0.556,\n              0.296,\n              0.012,\n              -0.248,\n              -0.688,\n              -1.204,\n              -1.764,\n              -2.04,\n              -2.04,\n              -1.788,\n              -1.688,\n              -1.9,\n              -1.876,\n              -1.636,\n              -1.376,\n              -1.212\n            ],\n            \"z\": [\n              -0.632,\n              -0.664,\n              -0.516,\n              -0.34,\n              -0.192,\n              -0.176,\n              -0.176,\n              -0.216,\n              -0.204,\n              -0.564,\n              -0.892,\n              -0.972,\n              -0.768,\n              -0.572,\n              -0.44,\n              -0.3,\n              -0.224,\n              -0.16,\n              -0.012,\n              0.168,\n              0.224,\n              0.176,\n              0.092,\n              0.012,\n              -0.076,\n              -0.116,\n              0.064,\n              0.536,\n              0.404,\n              0.224,\n              0.148,\n              0.144,\n              0.152,\n              0.072,\n              0.02,\n              -0.06,\n              -0.108,\n              -0.14,\n              -0.092,\n              -0.104,\n              -0.128,\n              -0.18,\n              -0.12,\n              -0.096,\n              -0.204,\n              -0.424,\n              -0.64,\n              -0.712,\n              -0.624,\n              -0.528,\n              -0.476,\n              -0.464,\n              -0.376,\n              -0.244,\n              -0.144,\n              -0.06,\n              -0.032,\n              0,\n              -0.008,\n              -0.036,\n              -0.004,\n              0.02,\n              -0.024,\n              0.016,\n              0.128,\n              0.112,\n              -0.024,\n              -0.172,\n              -0.028,\n              0.112,\n              0.036,\n              -0.096,\n              -0.216,\n              -0.2,\n              -0.072,\n              0.04,\n              0.004,\n              0.256,\n              0.372,\n              0.124,\n              0.208,\n              0.12,\n              -0.072,\n              -0.076,\n              0.096,\n              0.036,\n              -0.152,\n              -0.208,\n              -0.308\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272585713,\n          \"data\": {\n            \"x\": [\n              -2.04,\n              -2.04,\n              -1.612,\n              -1.492,\n              -1.368,\n              -1.344,\n              -0.848,\n              -0.78,\n              -0.472,\n              -0.624,\n              -0.592,\n              -0.612,\n              -0.504,\n              -0.508,\n              -0.468,\n              -0.284,\n              -0.324,\n              -0.776,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.984,\n              -1.912,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.976,\n              -1.796,\n              -1.708,\n              -1.62,\n              -1.576,\n              -1.692,\n              -1.472,\n              -1.376,\n              -1.192,\n              -0.992,\n              -0.784,\n              -0.748,\n              -0.58,\n              -0.492,\n              -1.06,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.952,\n              -2.04,\n              -2.036,\n              -2.04,\n              -1.992,\n              -1.952,\n              -1.928,\n              -1.904,\n              -1.952,\n              -2.02,\n              -2.04,\n              -2.024,\n              -1.916,\n              -1.668,\n              -1.296,\n              -0.764,\n              -0.4,\n              -0.18,\n              0,\n              -0.168,\n              -0.596,\n              -1.764,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04\n            ],\n            \"y\": [\n              -1.064,\n              -0.612,\n              -0.376,\n              -0.22,\n              -0.004,\n              0.612,\n              0.936,\n              -0.144,\n              0.008,\n              1.456,\n              1.9,\n              1.516,\n              1.272,\n              0.988,\n              0.748,\n              0.752,\n              0.984,\n              0.864,\n              0.152,\n              -1.26,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.52,\n              -1,\n              -0.588,\n              -0.188,\n              0.2,\n              0.436,\n              0.928,\n              1.048,\n              0.34,\n              1.4,\n              2.04,\n              1.52,\n              1.216,\n              1.316,\n              1.544,\n              1.4,\n              0.776,\n              -0.088,\n              0.212,\n              -1.304,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.716,\n              -1.056,\n              -0.612,\n              -0.276,\n              -0.18,\n              -0.24,\n              -0.02,\n              0.292,\n              0.692,\n              0.776,\n              0.912,\n              1.176,\n              1.316,\n              1.08,\n              1.06,\n              1.332,\n              1.472,\n              1.548,\n              1.232,\n              0.46,\n              -1.088,\n              -1.892,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04,\n              -2.04\n            ],\n            \"z\": [\n              0.88,\n              0.664,\n              0.34,\n              0.308,\n              0.464,\n              0.976,\n              1.3,\n              1.268,\n              1.136,\n              1.32,\n              1.372,\n              1.196,\n              0.868,\n              0.716,\n              0.548,\n              0.348,\n              0.368,\n              0.764,\n              1.364,\n              1.06,\n              0.88,\n              0.48,\n              -0.856,\n              -1.98,\n              -2.04,\n              -2.04,\n              -2.04,\n              -1.576,\n              -0.652,\n              0.304,\n              0.784,\n              0.932,\n              1.024,\n              0.932,\n              0.74,\n              0.736,\n              0.728,\n              0.744,\n              0.984,\n              1.26,\n              1.204,\n              1.112,\n              1.264,\n              1.096,\n              0.988,\n              0.936,\n              0.784,\n              0.92,\n              1.348,\n              1.488,\n              2.04,\n              2.04,\n              2.04,\n              2.04,\n              0.264,\n              -0.068,\n              1.112,\n              1.468,\n              1.332,\n              1.348,\n              1.852,\n              2.04,\n              2.04,\n              1.904,\n              1.66,\n              1.26,\n              0.976,\n              0.752,\n              0.82,\n              0.848,\n              0.772,\n              0.62,\n              0.456,\n              0.312,\n              0.324,\n              0.468,\n              0.616,\n              0.608,\n              0.524,\n              0.672,\n              1.26,\n              0.088,\n              1.036,\n              2.04,\n              0.764,\n              -1.112,\n              -1.716,\n              -0.876,\n              -0.972\n            ]\n          }\n        }\n      ]\n    },\n    {\n      \"icon\": \"Asleep\",\n      \"ID\": 1727272691910,\n      \"name\": \"Not exercising\",\n      \"recordings\": [\n        {\n          \"ID\": 1727272846488,\n          \"data\": {\n            \"x\": [\n              -0.296,\n              -0.296,\n              -0.3,\n              -0.3,\n              -0.288,\n              -0.296,\n              -0.304,\n              -0.316,\n              -0.304,\n              -0.3,\n              -0.3,\n              -0.304,\n              -0.3,\n              -0.3,\n              -0.304,\n              -0.296,\n              -0.296,\n              -0.292,\n              -0.3,\n              -0.304,\n              -0.304,\n              -0.304,\n              -0.308,\n              -0.304,\n              -0.304,\n              -0.308,\n              -0.304,\n              -0.312,\n              -0.308,\n              -0.312,\n              -0.316,\n              -0.312,\n              -0.304,\n              -0.308,\n              -0.304,\n              -0.312,\n              -0.304,\n              -0.312,\n              -0.304,\n              -0.3,\n              -0.304,\n              -0.292,\n              -0.304,\n              -0.296,\n              -0.3,\n              -0.304,\n              -0.3,\n              -0.3,\n              -0.296,\n              -0.3,\n              -0.296,\n              -0.304,\n              -0.304,\n              -0.308,\n              -0.308,\n              -0.308,\n              -0.3,\n              -0.304,\n              -0.308,\n              -0.308,\n              -0.304,\n              -0.316,\n              -0.308,\n              -0.304,\n              -0.312,\n              -0.296,\n              -0.304,\n              -0.304,\n              -0.304,\n              -0.304,\n              -0.3,\n              -0.3,\n              -0.296,\n              -0.292,\n              -0.296,\n              -0.3,\n              -0.296,\n              -0.304,\n              -0.3,\n              -0.292,\n              -0.284,\n              -0.304,\n              -0.292,\n              -0.304,\n              -0.292,\n              -0.3,\n              -0.308,\n              -0.312\n            ],\n            \"y\": [\n              0.98,\n              0.992,\n              1,\n              0.976,\n              0.952,\n              0.964,\n              0.972,\n              0.98,\n              0.972,\n              0.972,\n              0.98,\n              0.984,\n              0.976,\n              0.984,\n              0.98,\n              0.972,\n              0.964,\n              0.972,\n              0.976,\n              0.98,\n              0.964,\n              0.98,\n              0.98,\n              0.988,\n              0.988,\n              0.988,\n              0.984,\n              0.984,\n              0.976,\n              0.98,\n              0.972,\n              0.984,\n              0.984,\n              0.996,\n              0.984,\n              0.976,\n              0.976,\n              0.98,\n              0.984,\n              0.976,\n              0.964,\n              0.984,\n              0.98,\n              0.976,\n              0.976,\n              0.98,\n              0.976,\n              0.98,\n              0.988,\n              0.98,\n              0.98,\n              0.98,\n              0.996,\n              0.976,\n              0.976,\n              0.976,\n              0.968,\n              0.98,\n              0.968,\n              0.972,\n              0.992,\n              0.984,\n              0.976,\n              0.984,\n              0.992,\n              0.996,\n              0.98,\n              0.972,\n              0.98,\n              0.976,\n              0.976,\n              0.984,\n              0.984,\n              0.976,\n              0.972,\n              0.976,\n              0.976,\n              0.992,\n              0.972,\n              0.964,\n              0.972,\n              0.988,\n              1,\n              0.996,\n              0.992,\n              0.98,\n              0.984,\n              0.972\n            ],\n            \"z\": [\n              -0.08,\n              -0.092,\n              -0.092,\n              -0.096,\n              -0.096,\n              -0.092,\n              -0.096,\n              -0.104,\n              -0.092,\n              -0.096,\n              -0.096,\n              -0.088,\n              -0.096,\n              -0.088,\n              -0.096,\n              -0.092,\n              -0.096,\n              -0.1,\n              -0.096,\n              -0.084,\n              -0.1,\n              -0.084,\n              -0.092,\n              -0.08,\n              -0.072,\n              -0.084,\n              -0.084,\n              -0.088,\n              -0.084,\n              -0.084,\n              -0.08,\n              -0.076,\n              -0.084,\n              -0.092,\n              -0.084,\n              -0.088,\n              -0.08,\n              -0.092,\n              -0.076,\n              -0.092,\n              -0.092,\n              -0.1,\n              -0.092,\n              -0.088,\n              -0.092,\n              -0.088,\n              -0.084,\n              -0.092,\n              -0.092,\n              -0.088,\n              -0.072,\n              -0.092,\n              -0.092,\n              -0.092,\n              -0.084,\n              -0.084,\n              -0.08,\n              -0.092,\n              -0.092,\n              -0.088,\n              -0.08,\n              -0.096,\n              -0.092,\n              -0.084,\n              -0.088,\n              -0.092,\n              -0.096,\n              -0.088,\n              -0.092,\n              -0.096,\n              -0.096,\n              -0.096,\n              -0.096,\n              -0.1,\n              -0.088,\n              -0.1,\n              -0.096,\n              -0.1,\n              -0.1,\n              -0.092,\n              -0.1,\n              -0.108,\n              -0.084,\n              -0.092,\n              -0.084,\n              -0.092,\n              -0.104,\n              -0.08\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272840320,\n          \"data\": {\n            \"x\": [\n              0.256,\n              0.256,\n              0.252,\n              0.256,\n              0.26,\n              0.256,\n              0.252,\n              0.256,\n              0.256,\n              0.252,\n              0.252,\n              0.252,\n              0.252,\n              0.256,\n              0.264,\n              0.26,\n              0.252,\n              0.252,\n              0.264,\n              0.256,\n              0.256,\n              0.244,\n              0.248,\n              0.256,\n              0.256,\n              0.256,\n              0.264,\n              0.256,\n              0.248,\n              0.264,\n              0.256,\n              0.252,\n              0.248,\n              0.248,\n              0.248,\n              0.268,\n              0.268,\n              0.264,\n              0.252,\n              0.256,\n              0.256,\n              0.256,\n              0.252,\n              0.252,\n              0.252,\n              0.252,\n              0.252,\n              0.256,\n              0.256,\n              0.256,\n              0.248,\n              0.256,\n              0.252,\n              0.26,\n              0.248,\n              0.252,\n              0.252,\n              0.256,\n              0.256,\n              0.256,\n              0.248,\n              0.256,\n              0.252,\n              0.252,\n              0.252,\n              0.248,\n              0.252,\n              0.252,\n              0.256,\n              0.244,\n              0.252,\n              0.252,\n              0.252,\n              0.248,\n              0.252,\n              0.252,\n              0.248,\n              0.248,\n              0.252,\n              0.252,\n              0.248,\n              0.252,\n              0.252,\n              0.248,\n              0.252,\n              0.248,\n              0.252,\n              0.252,\n              0.252\n            ],\n            \"y\": [\n              -0.852,\n              -0.848,\n              -0.856,\n              -0.856,\n              -0.848,\n              -0.856,\n              -0.848,\n              -0.86,\n              -0.868,\n              -0.856,\n              -0.86,\n              -0.852,\n              -0.86,\n              -0.864,\n              -0.856,\n              -0.852,\n              -0.852,\n              -0.848,\n              -0.844,\n              -0.86,\n              -0.844,\n              -0.848,\n              -0.852,\n              -0.852,\n              -0.86,\n              -0.86,\n              -0.856,\n              -0.852,\n              -0.856,\n              -0.848,\n              -0.852,\n              -0.856,\n              -0.848,\n              -0.844,\n              -0.84,\n              -0.852,\n              -0.86,\n              -0.868,\n              -0.872,\n              -0.868,\n              -0.856,\n              -0.852,\n              -0.848,\n              -0.852,\n              -0.844,\n              -0.848,\n              -0.848,\n              -0.848,\n              -0.86,\n              -0.856,\n              -0.864,\n              -0.86,\n              -0.856,\n              -0.852,\n              -0.848,\n              -0.856,\n              -0.852,\n              -0.856,\n              -0.848,\n              -0.872,\n              -0.86,\n              -0.856,\n              -0.856,\n              -0.856,\n              -0.86,\n              -0.856,\n              -0.852,\n              -0.856,\n              -0.864,\n              -0.856,\n              -0.852,\n              -0.86,\n              -0.852,\n              -0.852,\n              -0.856,\n              -0.856,\n              -0.864,\n              -0.86,\n              -0.852,\n              -0.86,\n              -0.852,\n              -0.856,\n              -0.856,\n              -0.856,\n              -0.86,\n              -0.852,\n              -0.86,\n              -0.852,\n              -0.868\n            ],\n            \"z\": [\n              -0.488,\n              -0.476,\n              -0.48,\n              -0.476,\n              -0.472,\n              -0.48,\n              -0.48,\n              -0.484,\n              -0.476,\n              -0.48,\n              -0.488,\n              -0.488,\n              -0.484,\n              -0.48,\n              -0.48,\n              -0.476,\n              -0.48,\n              -0.476,\n              -0.476,\n              -0.476,\n              -0.476,\n              -0.472,\n              -0.484,\n              -0.476,\n              -0.476,\n              -0.488,\n              -0.48,\n              -0.488,\n              -0.484,\n              -0.484,\n              -0.48,\n              -0.484,\n              -0.488,\n              -0.48,\n              -0.472,\n              -0.476,\n              -0.48,\n              -0.472,\n              -0.488,\n              -0.48,\n              -0.476,\n              -0.488,\n              -0.484,\n              -0.484,\n              -0.48,\n              -0.468,\n              -0.476,\n              -0.484,\n              -0.476,\n              -0.472,\n              -0.476,\n              -0.484,\n              -0.484,\n              -0.48,\n              -0.484,\n              -0.48,\n              -0.476,\n              -0.48,\n              -0.48,\n              -0.48,\n              -0.472,\n              -0.484,\n              -0.476,\n              -0.484,\n              -0.488,\n              -0.472,\n              -0.472,\n              -0.48,\n              -0.476,\n              -0.48,\n              -0.48,\n              -0.488,\n              -0.484,\n              -0.48,\n              -0.488,\n              -0.476,\n              -0.48,\n              -0.472,\n              -0.484,\n              -0.48,\n              -0.48,\n              -0.472,\n              -0.476,\n              -0.476,\n              -0.476,\n              -0.48,\n              -0.472,\n              -0.476,\n              -0.48\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272790047,\n          \"data\": {\n            \"x\": [\n              -1.056,\n              -1.056,\n              -1.06,\n              -1.06,\n              -1.052,\n              -1.052,\n              -1.048,\n              -1.056,\n              -1.048,\n              -1.056,\n              -1.052,\n              -1.044,\n              -1.048,\n              -1.048,\n              -1.056,\n              -1.06,\n              -1.052,\n              -1.056,\n              -1.052,\n              -1.052,\n              -1.06,\n              -1.06,\n              -1.056,\n              -1.064,\n              -1.048,\n              -1.044,\n              -1.044,\n              -1.048,\n              -1.056,\n              -1.056,\n              -1.06,\n              -1.044,\n              -1.052,\n              -1.052,\n              -1.056,\n              -1.052,\n              -1.056,\n              -1.052,\n              -1.052,\n              -1.06,\n              -1.044,\n              -1.048,\n              -1.048,\n              -1.056,\n              -1.052,\n              -1.044,\n              -1.048,\n              -1.06,\n              -1.048,\n              -1.052,\n              -1.056,\n              -1.06,\n              -1.056,\n              -1.06,\n              -1.06,\n              -1.056,\n              -1.064,\n              -1.06,\n              -1.052,\n              -1.044,\n              -1.052,\n              -1.052,\n              -1.06,\n              -1.052,\n              -1.056,\n              -1.056,\n              -1.056,\n              -1.056,\n              -1.056,\n              -1.056,\n              -1.06,\n              -1.06,\n              -1.06,\n              -1.048,\n              -1.06,\n              -1.056,\n              -1.052,\n              -1.06,\n              -1.052,\n              -1.052,\n              -1.056,\n              -1.056,\n              -1.056,\n              -1.06,\n              -1.048,\n              -1.056,\n              -1.056,\n              -1.048,\n              -1.064\n            ],\n            \"y\": [\n              -0.144,\n              -0.152,\n              -0.148,\n              -0.148,\n              -0.144,\n              -0.168,\n              -0.152,\n              -0.164,\n              -0.152,\n              -0.152,\n              -0.156,\n              -0.144,\n              -0.152,\n              -0.14,\n              -0.16,\n              -0.144,\n              -0.148,\n              -0.144,\n              -0.148,\n              -0.144,\n              -0.148,\n              -0.144,\n              -0.144,\n              -0.164,\n              -0.144,\n              -0.152,\n              -0.156,\n              -0.144,\n              -0.144,\n              -0.144,\n              -0.144,\n              -0.14,\n              -0.136,\n              -0.152,\n              -0.144,\n              -0.164,\n              -0.148,\n              -0.16,\n              -0.148,\n              -0.16,\n              -0.156,\n              -0.14,\n              -0.14,\n              -0.14,\n              -0.144,\n              -0.144,\n              -0.136,\n              -0.144,\n              -0.144,\n              -0.144,\n              -0.148,\n              -0.152,\n              -0.148,\n              -0.14,\n              -0.16,\n              -0.156,\n              -0.152,\n              -0.148,\n              -0.152,\n              -0.144,\n              -0.14,\n              -0.14,\n              -0.144,\n              -0.14,\n              -0.144,\n              -0.148,\n              -0.16,\n              -0.156,\n              -0.152,\n              -0.152,\n              -0.144,\n              -0.148,\n              -0.144,\n              -0.144,\n              -0.148,\n              -0.14,\n              -0.136,\n              -0.14,\n              -0.156,\n              -0.156,\n              -0.14,\n              -0.144,\n              -0.144,\n              -0.144,\n              -0.148,\n              -0.14,\n              -0.144,\n              -0.144,\n              -0.14\n            ],\n            \"z\": [\n              0.032,\n              0.036,\n              0.032,\n              0.02,\n              0.032,\n              0.024,\n              0.024,\n              0.032,\n              0.036,\n              0.028,\n              0.036,\n              0.04,\n              0.028,\n              0.032,\n              0.032,\n              0.036,\n              0.032,\n              0.024,\n              0.024,\n              0.028,\n              0.028,\n              0.032,\n              0.024,\n              0.04,\n              0.036,\n              0.032,\n              0.028,\n              0.032,\n              0.028,\n              0.028,\n              0.028,\n              0.028,\n              0.02,\n              0.032,\n              0.032,\n              0.028,\n              0.036,\n              0.04,\n              0.028,\n              0.032,\n              0.024,\n              0.02,\n              0.02,\n              0.02,\n              0.032,\n              0.02,\n              0.024,\n              0.024,\n              0.024,\n              0.028,\n              0.024,\n              0.024,\n              0.032,\n              0.028,\n              0.024,\n              0.024,\n              0.02,\n              0.024,\n              0.024,\n              0.016,\n              0.028,\n              0.024,\n              0.028,\n              0.032,\n              0.028,\n              0.028,\n              0.028,\n              0.028,\n              0.028,\n              0.024,\n              0.02,\n              0.024,\n              0.028,\n              0.024,\n              0.024,\n              0.02,\n              0.028,\n              0.016,\n              0.024,\n              0.024,\n              0.024,\n              0.02,\n              0.024,\n              0.028,\n              0.024,\n              0.028,\n              0.02,\n              0.024,\n              0.02\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272784043,\n          \"data\": {\n            \"x\": [\n              0.008,\n              0.008,\n              0.012,\n              0.008,\n              0.004,\n              0.004,\n              0.004,\n              -0.004,\n              0.004,\n              0.004,\n              0.004,\n              -0.004,\n              0,\n              -0.004,\n              0,\n              0,\n              0,\n              0,\n              0.004,\n              0.008,\n              -0.004,\n              0.004,\n              0,\n              0,\n              0.004,\n              0,\n              0.008,\n              0.004,\n              0.004,\n              0.004,\n              0.004,\n              0.004,\n              0.008,\n              0.004,\n              0.008,\n              0.004,\n              0.004,\n              0.008,\n              0.008,\n              0.012,\n              0.008,\n              0.008,\n              0.004,\n              0.008,\n              0.004,\n              0,\n              0,\n              0.004,\n              0.004,\n              0,\n              0.004,\n              0,\n              0.004,\n              0,\n              0.004,\n              0.004,\n              0.008,\n              0.004,\n              0.008,\n              0.016,\n              0.008,\n              0.012,\n              0.004,\n              0.012,\n              0.008,\n              0.008,\n              0.008,\n              0.012,\n              0.004,\n              0.012,\n              0.004,\n              0.004,\n              0.004,\n              0.012,\n              0.008,\n              0.008,\n              0.008,\n              0.008,\n              0.016,\n              0.012,\n              0.004,\n              0.016,\n              0,\n              0.004,\n              0.008,\n              0.004,\n              0,\n              0.004,\n              0.016\n            ],\n            \"y\": [\n              -0.952,\n              -0.948,\n              -0.952,\n              -0.956,\n              -0.968,\n              -0.952,\n              -0.948,\n              -0.956,\n              -0.952,\n              -0.944,\n              -0.96,\n              -0.96,\n              -0.972,\n              -0.956,\n              -0.956,\n              -0.952,\n              -0.968,\n              -0.96,\n              -0.96,\n              -0.968,\n              -0.956,\n              -0.96,\n              -0.944,\n              -0.948,\n              -0.944,\n              -0.944,\n              -0.952,\n              -0.956,\n              -0.952,\n              -0.956,\n              -0.96,\n              -0.952,\n              -0.96,\n              -0.952,\n              -0.948,\n              -0.936,\n              -0.944,\n              -0.948,\n              -0.94,\n              -0.952,\n              -0.948,\n              -0.936,\n              -0.944,\n              -0.948,\n              -0.956,\n              -0.952,\n              -0.952,\n              -0.968,\n              -0.964,\n              -0.96,\n              -0.964,\n              -0.956,\n              -0.956,\n              -0.948,\n              -0.96,\n              -0.956,\n              -0.96,\n              -0.964,\n              -0.956,\n              -0.956,\n              -0.948,\n              -0.944,\n              -0.948,\n              -0.94,\n              -0.952,\n              -0.956,\n              -0.956,\n              -0.956,\n              -0.96,\n              -0.952,\n              -0.956,\n              -0.952,\n              -0.952,\n              -0.952,\n              -0.956,\n              -0.952,\n              -0.956,\n              -0.96,\n              -0.96,\n              -0.96,\n              -0.968,\n              -0.964,\n              -0.968,\n              -0.956,\n              -0.944,\n              -0.944,\n              -0.948,\n              -0.952,\n              -0.944\n            ],\n            \"z\": [\n              0.284,\n              0.276,\n              0.268,\n              0.284,\n              0.276,\n              0.276,\n              0.276,\n              0.264,\n              0.272,\n              0.26,\n              0.272,\n              0.276,\n              0.28,\n              0.276,\n              0.268,\n              0.276,\n              0.272,\n              0.28,\n              0.26,\n              0.272,\n              0.272,\n              0.272,\n              0.268,\n              0.268,\n              0.268,\n              0.268,\n              0.272,\n              0.268,\n              0.276,\n              0.272,\n              0.276,\n              0.272,\n              0.26,\n              0.28,\n              0.28,\n              0.268,\n              0.276,\n              0.272,\n              0.264,\n              0.276,\n              0.268,\n              0.26,\n              0.264,\n              0.26,\n              0.264,\n              0.272,\n              0.264,\n              0.264,\n              0.268,\n              0.268,\n              0.26,\n              0.268,\n              0.268,\n              0.268,\n              0.272,\n              0.276,\n              0.28,\n              0.268,\n              0.268,\n              0.256,\n              0.256,\n              0.252,\n              0.248,\n              0.256,\n              0.252,\n              0.264,\n              0.244,\n              0.256,\n              0.264,\n              0.264,\n              0.264,\n              0.248,\n              0.264,\n              0.256,\n              0.252,\n              0.256,\n              0.248,\n              0.256,\n              0.248,\n              0.244,\n              0.244,\n              0.252,\n              0.252,\n              0.256,\n              0.256,\n              0.252,\n              0.248,\n              0.244,\n              0.252\n            ]\n          }\n        },\n        {\n          \"ID\": 1727272755599,\n          \"data\": {\n            \"x\": [\n              -0.048,\n              -0.052,\n              -0.048,\n              -0.048,\n              -0.048,\n              -0.052,\n              -0.044,\n              -0.048,\n              -0.048,\n              -0.052,\n              -0.048,\n              -0.048,\n              -0.048,\n              -0.048,\n              -0.044,\n              -0.044,\n              -0.052,\n              -0.048,\n              -0.048,\n              -0.048,\n              -0.04,\n              -0.044,\n              -0.048,\n              -0.048,\n              -0.048,\n              -0.044,\n              -0.052,\n              -0.04,\n              -0.04,\n              -0.048,\n              -0.052,\n              -0.044,\n              -0.052,\n              -0.052,\n              -0.044,\n              -0.036,\n              -0.044,\n              -0.044,\n              -0.044,\n              -0.052,\n              -0.044,\n              -0.048,\n              -0.052,\n              -0.052,\n              -0.056,\n              -0.036,\n              -0.044,\n              -0.04,\n              -0.048,\n              -0.048,\n              -0.056,\n              -0.044,\n              -0.044,\n              -0.048,\n              -0.044,\n              -0.052,\n              -0.052,\n              -0.048,\n              -0.052,\n              -0.052,\n              -0.044,\n              -0.044,\n              -0.04,\n              -0.048,\n              -0.04,\n              -0.044,\n              -0.044,\n              -0.056,\n              -0.044,\n              -0.048,\n              -0.048,\n              -0.044,\n              -0.052,\n              -0.048,\n              -0.052,\n              -0.044,\n              -0.052,\n              -0.048,\n              -0.048,\n              -0.052,\n              -0.048,\n              -0.052,\n              -0.044,\n              -0.052,\n              -0.052,\n              -0.044,\n              -0.052,\n              -0.044\n            ],\n            \"y\": [\n              -0.352,\n              -0.336,\n              -0.356,\n              -0.34,\n              -0.348,\n              -0.348,\n              -0.344,\n              -0.356,\n              -0.344,\n              -0.348,\n              -0.356,\n              -0.348,\n              -0.344,\n              -0.336,\n              -0.356,\n              -0.348,\n              -0.344,\n              -0.34,\n              -0.356,\n              -0.348,\n              -0.352,\n              -0.348,\n              -0.34,\n              -0.352,\n              -0.352,\n              -0.348,\n              -0.34,\n              -0.352,\n              -0.352,\n              -0.344,\n              -0.348,\n              -0.356,\n              -0.34,\n              -0.344,\n              -0.344,\n              -0.352,\n              -0.344,\n              -0.344,\n              -0.356,\n              -0.344,\n              -0.344,\n              -0.348,\n              -0.344,\n              -0.348,\n              -0.348,\n              -0.348,\n              -0.344,\n              -0.34,\n              -0.34,\n              -0.348,\n              -0.352,\n              -0.348,\n              -0.344,\n              -0.352,\n              -0.348,\n              -0.34,\n              -0.348,\n              -0.34,\n              -0.344,\n              -0.34,\n              -0.344,\n              -0.36,\n              -0.344,\n              -0.348,\n              -0.344,\n              -0.352,\n              -0.348,\n              -0.344,\n              -0.344,\n              -0.332,\n              -0.352,\n              -0.352,\n              -0.348,\n              -0.344,\n              -0.34,\n              -0.348,\n              -0.356,\n              -0.352,\n              -0.348,\n              -0.352,\n              -0.348,\n              -0.344,\n              -0.34,\n              -0.356,\n              -0.356,\n              -0.348,\n              -0.34,\n              -0.344\n            ],\n            \"z\": [\n              -1.032,\n              -1.024,\n              -1.02,\n              -1.024,\n              -1.024,\n              -1.028,\n              -1.028,\n              -1.024,\n              -1.02,\n              -1.024,\n              -1.024,\n              -1.032,\n              -1.028,\n              -1.032,\n              -1.024,\n              -1.02,\n              -1.024,\n              -1.024,\n              -1.032,\n              -1.024,\n              -1.024,\n              -1.02,\n              -1.032,\n              -1.02,\n              -1.024,\n              -1.028,\n              -1.028,\n              -1.024,\n              -1.02,\n              -1.028,\n              -1.02,\n              -1.02,\n              -1.028,\n              -1.028,\n              -1.02,\n              -1.024,\n              -1.04,\n              -1.024,\n              -1.032,\n              -1.028,\n              -1.02,\n              -1.024,\n              -1.032,\n              -1.036,\n              -1.024,\n              -1.02,\n              -1.028,\n              -1.028,\n              -1.024,\n              -1.024,\n              -1.032,\n              -1.032,\n              -1.028,\n              -1.028,\n              -1.024,\n              -1.024,\n              -1.024,\n              -1.02,\n              -1.024,\n              -1.02,\n              -1.024,\n              -1.024,\n              -1.028,\n              -1.032,\n              -1.028,\n              -1.036,\n              -1.024,\n              -1.032,\n              -1.016,\n              -1.032,\n              -1.028,\n              -1.036,\n              -1.02,\n              -1.032,\n              -1.02,\n              -1.02,\n              -1.028,\n              -1.032,\n              -1.028,\n              -1.02,\n              -1.028,\n              -1.024,\n              -1.028,\n              -1.024,\n              -1.024,\n              -1.032,\n              -1.036,\n              -1.028\n            ]\n          }\n        }\n      ]\n    }\n  ]\n}",
  //         "main.blocks": "<xml xmlns=\"https://developers.google.com/blockly/xml\"><variables><variable id=\"XtWKtAh9Q7.WBI8gT.3*\">exercising-time</variable><variable id=\"++a#b#T;f,ia)x-@S7Rc\">not-exercising-time</variable><variable id=\")/cL@jmUkf511uCGFz|h\">unknown-time</variable></variables><block type=\"pxt-on-start\" x=\"0\" y=\"0\"><statement name=\"HANDLER\"><block type=\"variables_set\"><field name=\"VAR\" id=\"XtWKtAh9Q7.WBI8gT.3*\">exercising-time</field><value name=\"VALUE\"><shadow type=\"math_number\"><field name=\"NUM\">0</field></shadow></value><next><block type=\"variables_set\"><field name=\"VAR\" id=\"++a#b#T;f,ia)x-@S7Rc\">not-exercising-time</field><value name=\"VALUE\"><shadow type=\"math_number\"><field name=\"NUM\">0</field></shadow></value></block></next></block></statement></block><block type=\"ml_on_event_stop_detailed\" x=\"396\" y=\"3\"><field name=\"event\">ml.event.Exercising</field><value name=\"HANDLER_DRAG_PARAM_duration\"><block type=\"argument_reporter_number\"><mutation duplicateondrag=\"true\"></mutation><field name=\"VALUE\">duration</field></block></value><statement name=\"HANDLER\"><block type=\"device_clear_display\"><next><block type=\"variables_change\"><field name=\"VAR\" id=\"XtWKtAh9Q7.WBI8gT.3*\">exercising-time</field><value name=\"VALUE\"><shadow type=\"math_number\"><field name=\"NUM\">1</field></shadow><block type=\"argument_reporter_number\"><field name=\"VALUE\">duration</field></block></value></block></next></block></statement></block><block type=\"device_button_event\" x=\"841\" y=\"14\"><field name=\"NAME\">Button.A</field><statement name=\"HANDLER\"><block type=\"device_show_number\"><value name=\"number\"><shadow type=\"math_number\"><field name=\"NUM\">0</field></shadow><block type=\"math_arithmetic\"><field name=\"OP\">DIVIDE</field><value name=\"A\"><shadow type=\"math_number\" disabled-reasons=\"MANUALLY_DISABLED\"><field name=\"NUM\">0</field></shadow><block type=\"variables_get\"><field name=\"VAR\" id=\"XtWKtAh9Q7.WBI8gT.3*\">exercising-time</field></block></value><value name=\"B\"><shadow type=\"math_number\"><field name=\"NUM\">1000</field></shadow></value></block></value></block></statement></block><block type=\"ml_on_event_stop_detailed\" x=\"389\" y=\"203\"><field name=\"event\">ml.event.NotExercising</field><value name=\"HANDLER_DRAG_PARAM_duration\"><block type=\"argument_reporter_number\"><mutation duplicateondrag=\"true\"></mutation><field name=\"VALUE\">duration</field></block></value><statement name=\"HANDLER\"><block type=\"device_clear_display\"><next><block type=\"variables_change\"><field name=\"VAR\" id=\"++a#b#T;f,ia)x-@S7Rc\">not-exercising-time</field><value name=\"VALUE\"><shadow type=\"math_number\"><field name=\"NUM\">1</field></shadow><block type=\"argument_reporter_number\"><field name=\"VALUE\">duration</field></block></value></block></next></block></statement></block><block type=\"device_button_event\" x=\"847\" y=\"196\"><field name=\"NAME\">Button.B</field><statement name=\"HANDLER\"><block type=\"device_show_number\"><value name=\"number\"><shadow type=\"math_number\"><field name=\"NUM\">0</field></shadow><block type=\"math_arithmetic\"><field name=\"OP\">DIVIDE</field><value name=\"A\"><shadow type=\"math_number\" disabled-reasons=\"MANUALLY_DISABLED\"><field name=\"NUM\">0</field></shadow><block type=\"variables_get\"><field name=\"VAR\" id=\"++a#b#T;f,ia)x-@S7Rc\">not-exercising-time</field></block></value><value name=\"B\"><shadow type=\"math_number\"><field name=\"NUM\">1000</field></shadow></value></block></value></block></statement></block></xml>",
  //         "main.ts": "ml.onStopDetailed(ml.event.Exercising, function (duration) {\n    basic.clearScreen()\n    exercisingtime += duration\n})\ninput.onButtonPressed(Button.A, function () {\n    basic.showNumber(exercisingtime / 1000)\n})\ninput.onButtonPressed(Button.B, function () {\n    basic.showNumber(notexercisingtime / 1000)\n})\nml.onStopDetailed(ml.event.NotExercising, function (duration) {\n    basic.clearScreen()\n    notexercisingtime += duration\n})\nlet notexercisingtime = 0\nlet exercisingtime = 0\nexercisingtime = 0\nnotexercisingtime = 0\n",
  //         "pxt.json": "{\n    \"name\": \"Simple AI exercise timer\",\n    \"description\": \"\",\n    \"dependencies\": {\n        \"core\": \"*\",\n        \"microphone\": \"*\",\n        \"radio\": \"*\",\n        \"machine-learning\": \"github:microbit-foundation/pxt-microbit-ml#v0.4.3\"\n    },\n    \"files\": [\n        \"main.ts\",\n        \"main.blocks\",\n        \"autogenerated.ts\",\n        \"dataset.json\",\n        \"pxt.json\",\n        \"README.md\"\n    ],\n    \"targetVersions\": {\n        \"target\": \"7.1.2\",\n        \"pxt\": \"10.3.5\"\n    },\n    \"preferredEditor\": \"blocksprj\"\n}\n",
  //         "_history": "{\"entries\":[{\"timestamp\":1728049865319,\"editorVersion\":\"7.0.42\",\"changes\":[{\"type\":\"added\",\"filename\":\"autogenerated.ts\",\"value\":\"// Auto-generated. Do not edit.\\nnamespace ml {\\n  export namespace event {\\n      //% fixedInstance block=\\\"Exercising\\\"\\n  export const Exercising = new MlEvent(2, \\\"Exercising\\\");\\n  //% fixedInstance block=\\\"Not exercising\\\"\\n  export const NotExercising = new MlEvent(3, \\\"Not exercising\\\");\\n\\n    }\\n    \\n  events = [event.Unknown,event.Exercising,event.NotExercising];\\n    \\n  control.onEvent(MlRunnerIds.MlRunnerInference, 1, () => {\\n    if (!event.Unknown.onStartHandler) {\\n      maybeUpdateEventStats(event.Unknown);\\n    }\\n  });\\n  control.onEvent(MlRunnerIds.MlRunnerInference, 2, () => {\\n    if (!event.Exercising.onStartHandler) {\\n      maybeUpdateEventStats(event.Exercising);\\n    }\\n  });\\n  control.onEvent(MlRunnerIds.MlRunnerInference, 3, () => {\\n    if (!event.NotExercising.onStartHandler) {\\n      maybeUpdateEventStats(event.NotExercising);\\n    }\\n  });\\n\\n  getModelBlob = (): Buffer => {\\n    const result = hex`4C444F4D38001900500003000000000000000002CDCC4C3F0B45786572636973696E6700CDCC4C3F0F4E6F742065786572636973696E6700620F47304D4C3446500000002C0D0000A40500000000000000000000A80000000800000001000000080000000100000000000000000000000000000000000000180000000000000002000000000000002DE9F05F0F460169091839600021796038680346B3EC1E1A07F2080292EC010A20EE010A30EE210AA2EC010A92EC010A20EE020A30EE220AA2EC010A92EC010A20EE030A30EE230AA2EC010A92EC010A20EE040A30EE240AA2EC010A92EC010A20EE050A30EE250AA2EC010A92EC010A20EE060A30EE260AA2EC010A92EC010A20EE070A30EE270AA2EC010A92EC010A20EE080A30EE280AA2EC010A92EC010A20EE090A30EE290AA2EC010A92EC010A20EE0A0A30EE2A0AA2EC010A92EC010A20EE0B0A30EE2B0AA2EC010A92EC010A20EE0C0A30EE2C0AA2EC010A92EC010A20EE0D0A30EE2D0AA2EC010A92EC010A20EE0E0A30EE2E0AA2EC010A92EC010A20EE0F0A30EE2F0AA2EC010A02F22402B3EC121A07F2440292EC010A20EE010A30EE210AA2EC010A92EC010A20EE020A30EE220AA2EC010A92EC010A20EE030A30EE230AA2EC010A92EC010A20EE040A30EE240AA2EC010A92EC010A20EE050A30EE250AA2EC010A92EC010A20EE060A30EE260AA2EC010A92EC010A20EE070A30EE270AA2EC010A92EC010A20EE080A30EE280AA2EC010A92EC010A20EE090A30EE290AA2EC010A02F23C02386800F2C00307F268021024B3EC010A07F20801F1EC0E0AF3EC0E7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A65EEAC5A30EE050A26EE0D6A30EE250A66EEAD6A30EE060A27EE0E7A30EE260A30EE070AF1EC0A0AF3EC0A7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A30EE050AA2EC010A013C8FD107F2680210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C210680028B8BF40F2000001C2386800F2007307F208020224B3EC010A07F26801F1EC0E0AF3EC0E7A60EEA70A21EE081A30EE200A61EEA81A30EE010A22EE092A30EE210A62EEA92A30EE020A23EE0A3A30EE220A63EEAA3A30EE030A24EE0B4A30EE230A64EEAB4A30EE040A25EE0C5A30EE240A65EEAC5A30EE050A26EE0D6A30EE250A66EEAD6A30EE060A27EE0E7A30EE260A30EE070AF1EC020AF3EC027A60EEA70A21EE081A30EE200A30EE010AA2EC010A013CAFD107F208021046022100F002F8BDE8F09F012938B5D0ED002A29D9031D00EB8102F3EC017AF4EE627AF1EE10FAC8BFF0EE672A9A42F4D1002402EE104A054695ED000A30EE620A00F015F80134A14232EE002AA5EC010AF2D8002390ED007AC7EE027A01339942E0EC017AF6D838BD0029E1D138BDDFED297AB4EEE70AF1EE10FA48D4DFED277AB4EEE70AF1EE10FA3ADCDFED247ADFED244A9FED243ADFED243A9FED245A9FED244ADFED245A9FED246ADFED246A60EE277AB7EE007A77EEA47A77EEE47AA7EE830AFDEEE74AA7EEA30AF0EE457AE4EE007A14EE903AE7EE805AA5EE806AE6EE006AF0EE667AF0EE476AE7EE806AA6EE807A17EE102A02EBC35300EE103A7047DFED107AB7EE007A87EE270A70479FED0C0A704700000000AAC20000AE423BAAB83F0000404B007231BF8EBEBFB56E2F093C00A0B43AADAD2A3D28AA2A3EFBFFFF3E0000000059D0953F799026BD2B527B3F93FA7DBECD01913F2730F7BE80DEAE3FB32EDC3E7829A33FB4147A3EFB59A93F5EC956BEBE2B863F6135183F9FF8833F0CB5253F84D6903F9567DA3E6C5CD83FE25994BEAFB6B23FFCBCB7BE45C5AF3F5613BABE20C41F3FF7BD2FBF4E9F023F322A36BF6C53263FBC4959BF39A3EB3C7B329CBFC1E4393D4826DEBF3547223D68007BBF31AFC63FBA16C6BBF4CAC83F6CEDB0BCADFAB83F21358BBDD8E8B23F142A17BF15D1AD3F4F6D31BF8947AB3F87CFD2BE973C4BBC6780D5BD8F1A80BE41A5B0BDE8EFE43DC20F303E8E232BBCFFF501BD0068F4BB4496293D8BB6683E26351D3EA94792BE3FC12EBD42622DBEA1BF40BE7233D6BEC03DF8BDA5779CBD25EB643EB1289D3D05429D3DA4F0C5BE0A83923EF21CA53C22E35A3D8477C0BE68365BBEEA5419BEF32C2FBC56B15F3EB9C991BE33DFB4BEA0220D3EEECF87BEBEEDD6BED46DABBE9F0686BE1DA4F83CF598973C9AF70BBFBB1785BE43AA43BC2E3CA4BE84068A3E29DB37BE34A20C3E37D702BED7F704BE27040E3E34AC90B9AA24BB3DD51308BE6477993D18CB03BE0506C0BEA83CB23EFDDF6CBE0E32243EB8E3D53D78FFD7BDD518B13EF43858BCCF02243E50F610BE4388FCBC5539D03D9B23B5BD3AF8103EC53B843E81B6A43EAEE7ADBE9C0636BE992A85BEC342633EB7318CBD2BB9873E658A66BDD23CB1BE4EFA36BEC0D19EBEB5884D3EBAC9CEBD0CEC83BEBFB2BDBD5A9C56BC1176B2BE7C8EFEBD06EC853EC37F15BE3B991EBE17A814BD79A041BE8BB93C3DD76E53BEEA724E3E884D4F3EBC417BBEDA9A863CF0F455BE7E80C93CCFB8A5BEF7D18A3DC1FA543EEFA34D3E75DDCC3D7D55B73D6073543D0531F0BD3B2E803EE467113DD2F5C53EFDE8A7BD05ACEA3A902CAB3EBFC47A3E7412E03EC852EA3E9D9EF43D131B8D3D5A01A33DC4F7F3BD74A234BEC42D223EFAAEC9BEDA87AA3CE621E53DE31DFB3D2B9F38BE5C433F3E398A8A3E799C8BBE41A084BD5801EBBE137AF9BE9CC6E9BD642991BEC4B9433EEED8A23C802CD3BD4110A23E6F60A43DCC1D0B3E957412BD2AB9953E9FD6A43EEA9974BC55735E3C08C449BE708FED3D99CE5F3DE623B53EDC098CBEDF5BCB3D67F317BEC25A113DB80498BE996E45BD4A6AC7BD3862313E9B628C3E9D72A73E54FA133EA9D7E5BD6CB60C3F0B573B3E119C9EBEEEB0ECBDBFDF0ABD8E18533D49E12DBC1326A53CE0A6C03E742CBABE9FFC92BDA99A9D3DF4EC39BDEDF04A3ECD301ABE314151BE1F0ADCBC95B119BEB9B08EBEECD888BE3A76DEBD4C5D3F3D53F954BE96EAAA3D0D96AB3C4BBB633E0B2BAC3D9800C73D7F9D123D5E13853EB96CCABDAFAB0FBEB68639BE4D1D243E1775BEBD7C39873E3C5E4D3C953E53BE97996ABE719CA0BE3B3FAE3E8874873EAAEFF4BA59B59E3C09473B3C1FC82DBDB2476ABEA6636EBE07F675BEFAC74B3ED2948EBD469156BD2E9F7CBEB42D8B3DDE110FBE5A0F3ABE848580BE6DC6613D364796BDF03B5EBEF29B52BE5A97B93D513B2ABD4996073E7F4F57BEAEB7773E2527AEBD2691123E490AF2BBA593C43D50EB6A3D8269DBBE26E290BE6BB64BBEEE2F92BE4C9A08BD499FAFBE1EE773BE5B9C7B3E5A0968BEBDD4FBBDFACE9ABDCE0822BEAE10473DC49400BE78A3833C9BD6CA3CAC86AABD9B6E9C3ECB8B103EED21BEBEFB0D323DD37300BE156851BCCB6DBC3E34A7DA3D5FC2B53E2FEE48BEA192E4BB19FA20BD1E91C8BD8CA151BE0800D5BE4C667DBDA32CBFBB1EEF793EAD567E3E76BCBC3D7511933EF1B2883E754E223EFE74593C049DFB3CFA97123D61FC8A3ECA815C3E8A42383EA9528A3D2EC4A9BE868E78BB18CFF6BD52E1493DCAF0653DEF5C45BEC51B123D6CAA81BECDD53BBD7C08ED3D8114C03EB8A66BBD7B60993E631C673DF53F0E3DB59DC03C4C4021BE34BB4F3ECFB810BDED7A5ABEF9B40F3D70F9E3BEDF24023D0B83533D1DA8553D7A048CBE1E75C43CEBF4C03DE6C991BE712D3CBE517E3E3E92B4303D63BACC3DD39D553D7614173E30C8843ECA75373D140A193DB1CF863E9F74CE3DCB09973DC04FBB3E299D173E86F5793DAAE9533D0903EC3D3E896DBD61C387BE196ACBBEAB19B43E355C5ABE69774F3D751239BEF7939B3AF9006E3E8E7E3ABDB53CD63D50A500BEE566503EDBE856BEB2181FBDE7D65F3E8548D73E9B13BE3E4966373E731B123E6E79593E524B1D3E817E333D5DF460BEDC2866BC7CE467BEC07094BCEC1FACBE0B8831BE4D4BBDBB702E0F3ED2F49C3D3F8D82BE690FFF3D04AC22BC00D1F8BC3FE270BD6897ACBEBFC419BEE408A03D2CF3DFBCF730443D124B66BE455C5CBEC7A289BD2836EC3CF5A7363D22B9583ED6B0D1BD66ECF73D3A57253D6C9211BFD88874BECC6A85BE6DCE07BF7079E4BD1AD1C4BB7C6CFE3E59653E3E8F7FA9BEF973AB3DF728023D00AE253E153A8E3D18EDA33E99DFEEBEC97051BEEA32433E29B71F3EBC51C03EEDD8703EBFAEB3BE9EF7EE3D9E72FCBE5CB6B9BEDB567D3EA24C4E3CB34F893E41F52C3E9FEF053F194FD6BD482EDBBDB721C2BEA8C568BECA3E41BEA61E04BEDBFD8B3E7403F9BE3E952C3F9EF7EEBD721B8DBE8192D93E16E0A53D59A37A3EDBB7A8BDF99484BE197950BE13CC13BFB57C0A3FD476173F92FEEABE7848F5BE1195B7BD2AA7F5BEAF53383ECE043EBF00000000`;\\n    return result;\\n  };\\n\\n  simulatorSendData();\\n}\\n\\n// Auto-generated. Do not edit. Really.\\n\"},{\"type\":\"added\",\"filename\":\"main.blocks\",\"value\":\"<xml xmlns=\\\"https://developers.google.com/blockly/xml\\\"><variables><variable id=\\\"XtWKtAh9Q7.WBI8gT.3*\\\">exercising-time</variable><variable id=\\\"++a#b#T;f,ia)x-@S7Rc\\\">not-exercising-time</variable><variable id=\\\")/cL@jmUkf511uCGFz|h\\\">unknown-time</variable></variables><block type=\\\"pxt-on-start\\\" x=\\\"0\\\" y=\\\"0\\\"><statement name=\\\"HANDLER\\\"><block type=\\\"variables_set\\\"><field name=\\\"VAR\\\" id=\\\"XtWKtAh9Q7.WBI8gT.3*\\\">exercising-time</field><value name=\\\"VALUE\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">0</field></shadow></value><next><block type=\\\"variables_set\\\"><field name=\\\"VAR\\\" id=\\\"++a#b#T;f,ia)x-@S7Rc\\\">not-exercising-time</field><value name=\\\"VALUE\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">0</field></shadow></value></block></next></block></statement></block><block type=\\\"ml_on_event_stop_detailed\\\" x=\\\"396\\\" y=\\\"3\\\"><field name=\\\"event\\\">ml.event.Exercising</field><value name=\\\"HANDLER_DRAG_PARAM_duration\\\"><block type=\\\"argument_reporter_number\\\"><mutation duplicateondrag=\\\"true\\\"></mutation><field name=\\\"VALUE\\\">duration</field></block></value><statement name=\\\"HANDLER\\\"><block type=\\\"device_clear_display\\\"><next><block type=\\\"variables_change\\\"><field name=\\\"VAR\\\" id=\\\"XtWKtAh9Q7.WBI8gT.3*\\\">exercising-time</field><value name=\\\"VALUE\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">1</field></shadow><block type=\\\"argument_reporter_number\\\"><field name=\\\"VALUE\\\">duration</field></block></value></block></next></block></statement></block><block type=\\\"device_button_event\\\" x=\\\"841\\\" y=\\\"14\\\"><field name=\\\"NAME\\\">Button.A</field><statement name=\\\"HANDLER\\\"><block type=\\\"device_show_number\\\"><value name=\\\"number\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">0</field></shadow><block type=\\\"math_arithmetic\\\"><field name=\\\"OP\\\">DIVIDE</field><value name=\\\"A\\\"><shadow type=\\\"math_number\\\" disabled-reasons=\\\"MANUALLY_DISABLED\\\"><field name=\\\"NUM\\\">0</field></shadow><block type=\\\"variables_get\\\"><field name=\\\"VAR\\\" id=\\\"XtWKtAh9Q7.WBI8gT.3*\\\">exercising-time</field></block></value><value name=\\\"B\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">1000</field></shadow></value></block></value></block></statement></block><block type=\\\"ml_on_event_stop_detailed\\\" x=\\\"389\\\" y=\\\"203\\\"><field name=\\\"event\\\">ml.event.NotExercising</field><value name=\\\"HANDLER_DRAG_PARAM_duration\\\"><block type=\\\"argument_reporter_number\\\"><mutation duplicateondrag=\\\"true\\\"></mutation><field name=\\\"VALUE\\\">duration</field></block></value><statement name=\\\"HANDLER\\\"><block type=\\\"device_clear_display\\\"><next><block type=\\\"variables_change\\\"><field name=\\\"VAR\\\" id=\\\"++a#b#T;f,ia)x-@S7Rc\\\">not-exercising-time</field><value name=\\\"VALUE\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">1</field></shadow><block type=\\\"argument_reporter_number\\\"><field name=\\\"VALUE\\\">duration</field></block></value></block></next></block></statement></block><block type=\\\"device_button_event\\\" x=\\\"847\\\" y=\\\"196\\\"><field name=\\\"NAME\\\">Button.B</field><statement name=\\\"HANDLER\\\"><block type=\\\"device_show_number\\\"><value name=\\\"number\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">0</field></shadow><block type=\\\"math_arithmetic\\\"><field name=\\\"OP\\\">DIVIDE</field><value name=\\\"A\\\"><shadow type=\\\"math_number\\\" disabled-reasons=\\\"MANUALLY_DISABLED\\\"><field name=\\\"NUM\\\">0</field></shadow><block type=\\\"variables_get\\\"><field name=\\\"VAR\\\" id=\\\"++a#b#T;f,ia)x-@S7Rc\\\">not-exercising-time</field></block></value><value name=\\\"B\\\"><shadow type=\\\"math_number\\\"><field name=\\\"NUM\\\">1000</field></shadow></value></block></value></block></statement></block></xml>\"},{\"type\":\"added\",\"filename\":\"main.ts\",\"value\":\"ml.onStopDetailed(ml.event.Exercising, function (duration) {\\n    basic.clearScreen()\\n    exercisingtime += duration\\n})\\ninput.onButtonPressed(Button.A, function () {\\n    basic.showNumber(exercisingtime / 1000)\\n})\\ninput.onButtonPressed(Button.B, function () {\\n    basic.showNumber(notexercisingtime / 1000)\\n})\\nml.onStopDetailed(ml.event.NotExercising, function (duration) {\\n    basic.clearScreen()\\n    notexercisingtime += duration\\n})\\nlet notexercisingtime = 0\\nlet exercisingtime = 0\\nexercisingtime = 0\\nnotexercisingtime = 0\\n\"},{\"type\":\"added\",\"filename\":\"pxt.json\",\"value\":\"{\\n    \\\"name\\\": \\\"Simple AI exercise timer\\\",\\n    \\\"description\\\": \\\"\\\",\\n    \\\"dependencies\\\": {\\n        \\\"core\\\": \\\"*\\\",\\n        \\\"microphone\\\": \\\"*\\\",\\n        \\\"radio\\\": \\\"*\\\",\\n        \\\"machine-learning\\\": \\\"github:microbit-foundation/pxt-microbit-ml#v0.4.3\\\"\\n    },\\n    \\\"files\\\": [\\n        \\\"main.ts\\\",\\n        \\\"main.blocks\\\",\\n        \\\"autogenerated.ts\\\",\\n        \\\"dataset.json\\\",\\n        \\\"pxt.json\\\",\\n        \\\"README.md\\\"\\n    ],\\n    \\\"targetVersions\\\": {\\n        \\\"target\\\": \\\"7.1.2\\\",\\n        \\\"pxt\\\": \\\"10.3.5\\\"\\n    },\\n    \\\"preferredEditor\\\": \\\"blocksprj\\\"\\n}\\n\"}]}],\"snapshots\":[{\"timestamp\":1728049865318,\"editorVersion\":\"7.0.42\",\"text\":{}}],\"shares\":[],\"lastSaveTime\":1728049865319}"
  //     }
  // }
};

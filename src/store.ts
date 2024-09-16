import uuid4 from "uuid4";
import { Project } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import {
  DatasetEditorJsonFormat,
  Gesture,
  GestureData,
  RecordingData,
  TrainModelDialogStage,
} from "./model";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { trainModel } from "./ml";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { devtools, persist } from "zustand/middleware";
import { flags } from "./flags";
import { defaultSettings, Settings } from "./settings";
import { useShallow } from "zustand/react/shallow";

export const modelUrl = "indexeddb://micro:bit-ml-tool-model";

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
        ? generateCustomFiles(gestureData, model)
        : generateProject(gestureData, model).text),
    },
  };
  return {
    project: updatedProject,
    projectEdited,
    appEditNeedsFlushToEditor: true,
  };
};

export interface Store {
  gestures: GestureData[];
  isRecording: boolean;

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
  loadDataset(gestures: GestureData[]): void;

  model: tf.LayersModel | undefined;

  isEditorOpen: boolean;
  appEditNeedsFlushToEditor: boolean;
  changedHeaderExpected: boolean;
  setEditorOpen(open: boolean): void;

  recordingStarted(): void;
  recordingStopped(): void;
  newSession(): void;

  trainModel(): Promise<boolean>;

  project: Project;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;

  settings: Settings;
  setSettings(update: Partial<Settings>): void;

  /**
   * Resets the project.
   */
  resetProject: () => void;

  loadProject: (project: Project) => void;

  editorChange: (project: Project) => void;

  expectChangedHeader(): void;
  projectFlushedToEditor(): void;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;
  trainModelFlowStart: () => Promise<void>;
  closeTrainModelDialogs: () => void;
}

export const useAppStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        gestures: [],
        isRecording: false,
        project: {
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
        },
        projectEdited: false,
        settings: defaultSettings,
        model: undefined,
        isEditorOpen: false,
        appEditNeedsFlushToEditor: false,
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
          get().deleteAllGestures();
          get().resetProject();
        },

        setEditorOpen(open: boolean) {
          set(
            {
              isEditorOpen: open,
              // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
              projectEdited: true,
            },
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
          return set(({ gestures }) => ({
            gestures: gestures.map((g) => {
              if (g.ID === id) {
                return { ...g, recordings: [...recs, ...g.recordings] };
              }
              return g;
            }),
            model: undefined,
          }));
        },

        deleteGesture(id: GestureData["ID"]) {
          return set(({ project, projectEdited, gestures }) => {
            const newGestures = gestures.filter((g) => g.ID !== id);
            return {
              gestures: newGestures,
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
            const newGestures = gestures.map((g) => {
              if (g.ID === id) {
                g.icon = icon;
              } else if (g.ID !== id && g.icon === icon && currentIcon) {
                g.icon = currentIcon;
              }
              return g;
            });
            // TODO: check this
            const currentIcon = gestures.find((g) => g.ID === id)?.icon;
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
            gestures: [],
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

        closeTrainModelDialogs() {
          set({
            trainModelDialogStage: TrainModelDialogStage.Closed,
          });
        },

        async trainModelFlowStart() {
          if (get().settings.showPreTrainHelp) {
            set({
              // TODO: this should respect the settings which should be in the state
              trainModelDialogStage: TrainModelDialogStage.ShowingIntroduction,
            });
          } else {
            await get().trainModel();
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
        loadProject(newProject: Project) {
          // MakeCode has loaded a new hex, update our state to match:
          const datasetString = newProject.text?.[filenames.datasetJson];
          const dataset = datasetString
            ? (JSON.parse(datasetString) as DatasetEditorJsonFormat)
            : { data: [], lastModified: Date.now() };

          set(
            {
              project: newProject,
              projectEdited: true,
              appEditNeedsFlushToEditor: true,
              gestures: dataset.data,
              model: undefined,
            },
            false,
            "loadProject"
          );
        },
        editorChange(newProject: Project) {
          const actionName = "editorChange";
          set(
            (state) => {
              const {
                project: prevProject,
                isEditorOpen,
                expectChangedHeader,
              } = state;
              const newProjectHeader = newProject.header!.id;
              const previousProjectHeader = prevProject.header!.id;
              if (
                newProjectHeader !== previousProjectHeader &&
                !expectChangedHeader
              ) {
                // It's a new project. Thanks user. We'll update our state.
                // This will cause another write to MakeCode but that's OK as it gives us
                // a chance to validate/update the project
                const datasetString = newProject.text?.[filenames.datasetJson];
                const dataset = datasetString
                  ? (JSON.parse(datasetString) as DatasetEditorJsonFormat)
                  : { data: [] };

                return {
                  project: newProject,
                  // New project loaded externally so we can't know whether its edited.
                  projectEdited: true,
                  changedHeaderExpected: false,
                  gestures: dataset.data,
                  model: undefined,
                };
              } else if (isEditorOpen) {
                return {
                  project: newProject,
                  changedHeaderExpected: false,
                };
              }
              return state;
            },
            false,
            actionName
          );
        },
        expectChangedHeader() {
          set({ changedHeaderExpected: true });
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
      }),
      {
        name: "ml",
        partialize: ({ gestures, project, projectEdited, settings }) => ({
          gestures,
          project,
          projectEdited,
          settings,
          // The model itself is in IndexDB
        }),
      }
    ),
    { enabled: flags.devtools }
  )
);

tf.loadLayersModel(modelUrl)
  .then((model) => {
    if (model) {
      useAppStore.setState({ model }, false, "loadModel");
    }
  })
  .catch(() => {
    // This happens if there's no model.
  });

useAppStore.subscribe((state, prevState) => {
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
  const gestures = useAppStore((s) => s.gestures);
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
  const gestures = useAppStore((s) => s.gestures);
  return hasSufficientDataForTraining(gestures);
};

export const useHasNoStoredData = (): boolean => {
  const gestures = useAppStore((s) => s.gestures);
  return !(
    gestures.length !== 0 && gestures.some((g) => g.recordings.length > 0)
  );
};

type UseSettingsReturn = [Settings, (settings: Partial<Settings>) => void];

export const useSettings = (): UseSettingsReturn => {
  return useAppStore(useShallow((s) => [s.settings, s.setSettings]));
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

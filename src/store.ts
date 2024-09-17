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
  DownloadProjectStage,
  DownloadProjectStep,
  Gesture,
  GestureData,
  MicrobitToFlash,
  RecordingData,
  TrainModelDialogStage,
} from "./model";
import { defaultSettings, Settings } from "./settings";
import { triggerBrowserDownload } from "./utils/fs-util";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";

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

const generateFirstGesture = () => ({
  icon: defaultIcons[0],
  ID: Date.now(),
  name: "",
  recordings: [],
});

export interface State {
  gestures: GestureData[];
  model: tf.LayersModel | undefined;

  isRecording: boolean;

  project: Project;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;
  changedHeaderExpected: boolean;
  appEditNeedsFlushToEditor: boolean;
  isEditorOpen: boolean;
  downloadStage: DownloadProjectStage;

  settings: Settings;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;
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
  loadDataset(gestures: GestureData[]): void;
  setEditorOpen(open: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(): void;
  trainModelFlowStart: () => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  setSettings(update: Partial<Settings>): void;
  /**
   * Resets the project.
   */
  resetProject(): void;

  /**
   * Remainer are used by project hooks for MakeCode integration.
   */
  editorChange(project: Project): void;
  editorSave(project: { hex: string; name: string }): void;
  setChangedHeaderExpected(): void;
  projectFlushedToEditor(): void;
  setDownloadStage(stage: DownloadProjectStage): void;
}

type Store = State & Actions;

export const useStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        gestures: [generateFirstGesture()],
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
        downloadStage: {
          step: DownloadProjectStep.None,
          microbitToFlash: MicrobitToFlash.Default,
          flashProgress: 0,
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
            ({ downloadStage }) => ({
              isEditorOpen: open,
              // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
              projectEdited: true,
              downloadStage: {
                ...downloadStage,
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
              gestures:
                newGestures.length === 0
                  ? [generateFirstGesture()]
                  : newGestures,
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
            gestures: [generateFirstGesture()],
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
                  // New project loaded externally so we can't know whether its edited.
                  projectEdited: true,
                  gestures: dataset.data,
                  model: undefined,
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
        setDownloadStage(downloadStage: DownloadProjectStage) {
          set({ downloadStage });
        },
        editorSave(project: { hex: string; name: string }) {
          console.log("editorSave");
          // TODO: We'd like to trigger the same UI as we do for the "Save"
          // buttob but with this project rather than poking MakeCode.
          triggerBrowserDownload(project);
        },
        setChangedHeaderExpected() {
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

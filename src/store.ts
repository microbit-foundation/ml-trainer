import { Project } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import {
  GestureContextState,
  GestureData,
  RecordingData,
} from "./gestures-hooks";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { trainModel } from "./ml";
import { MlStage, MlStatus } from "./ml-status-hooks";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { devtools, persist } from "zustand/middleware";
import { flags } from "./flags";

export const modelUrl = "indexeddb://micro:bit-ml-tool-model";

export const enum FlushType {
  Immediate,
  Debounced,
}

export interface Store {
  gestures: GestureData[];
  gesturesLastModified: number;
  isRecording: boolean;

  getDefaultIcon(options: {
    isFirstGesture: boolean;
    existingGestures: { icon?: MakeCodeIcon }[];
  }): MakeCodeIcon;
  generateNewGesture(isFirstGesture?: boolean): GestureData;
  validateAndSetGestures(gestures: Partial<GestureData>[]): void;
  setGestures(gestures: GestureData[], isRetrainNeeded?: boolean): void;
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

  mlStatus: MlStatus;

  isEditorOpen: boolean;
  appEditNeedsFlushToEditor: FlushType | undefined;

  openEditor(): void;
  closeEditor(): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(): void;

  trainModel(): Promise<MlStatus>;

  project: Project;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;

  /**
   * Resets the project.
   */
  resetProject: () => void;

  loadProject: (project: Project) => void;

  editorChange: (project: Project) => void;

  projectFlushedToEditor(): void;
}

// TODO: persistence
export const useAppStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        gestures: [],
        gesturesLastModified: Date.now(),
        isRecording: false,
        project: generateProject(
          { data: [], lastModified: Date.now() },
          undefined
        ),
        projectEdited: false,
        mlStatus: { stage: MlStage.InsufficientData } as const,
        isEditorOpen: false,
        appEditNeedsFlushToEditor: undefined,

        newSession() {
          get().deleteAllGestures();
        },

        openEditor() {
          set({ isEditorOpen: true }, false, "openEditor");
        },

        closeEditor() {
          set({ isEditorOpen: false }, false, "closeEditor");
        },

        recordingStarted() {
          set({ isRecording: true }, false, "recordingStarted");
        },
        recordingStopped() {
          set({ isRecording: false }, false, "recordingStopped");
        },

        getDefaultIcon({ isFirstGesture, existingGestures }) {
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
        },

        generateNewGesture(isFirstGesture: boolean = false): GestureData {
          return {
            name: "",
            recordings: [],
            ID: Date.now(),
            icon: get().getDefaultIcon({
              isFirstGesture,
              existingGestures: get().gestures,
            }),
          };
        },

        validateAndSetGestures(gestures: Partial<GestureData>[]) {
          const validGestures: GestureData[] = [];
          gestures.forEach((g) => {
            if (g.ID && g.name !== undefined && Array.isArray(g.recordings)) {
              if (!g.icon) {
                g.icon = get().getDefaultIcon({
                  existingGestures: [...validGestures, ...gestures],
                  isFirstGesture: false,
                });
              }
              validGestures.push(g as GestureData);
            }
          });
          get().setGestures(validGestures);
        },

        setGestures(gestures: GestureData[], isRetrainNeeded: boolean = true) {
          set(
            ({ mlStatus: previousMlStatus }) => {
              gestures =
                // Always have at least one gesture for walk through
                gestures.length === 0
                  ? [get().generateNewGesture(true)]
                  : gestures;

              const mlStatus = !hasSufficientDataForTraining(gestures)
                ? { stage: MlStage.InsufficientData as const }
                : isRetrainNeeded ||
                  previousMlStatus.stage === MlStage.InsufficientData
                ? // Updating status to retrain status is in status hook
                  { stage: MlStage.NotTrained as const }
                : previousMlStatus;

              const gesturesLastModified = Date.now();
              return {
                gestures,
                gesturesLastModified,
                mlStatus,
                ...updateProject(
                  get(),
                  gestures,
                  gesturesLastModified,
                  mlStatus
                ),
              };
            },
            false,
            "setGestures"
          );
        },

        addNewGesture() {
          const { gestures, setGestures } = get();
          setGestures([...gestures, get().generateNewGesture()]);
        },

        addGestureRecordings(id: GestureData["ID"], recs: RecordingData[]) {
          const { gestures, setGestures } = get();
          const newGestures = gestures.map((g) => {
            return id !== g.ID
              ? g
              : { ...g, recordings: [...recs, ...g.recordings] };
          });
          setGestures(newGestures);
        },

        deleteGesture(id: GestureData["ID"]) {
          const { gestures, setGestures } = get();
          setGestures(gestures.filter((g) => g.ID !== id));
        },

        setGestureName(id: GestureData["ID"], name: string) {
          const { gestures, setGestures } = get();
          const newGestures = gestures.map((g) => {
            return id !== g.ID ? g : { ...g, name };
          });
          setGestures(newGestures, false);
        },

        setGestureIcon(id: GestureData["ID"], icon: MakeCodeIcon) {
          const { gestures, setGestures } = get();
          const currentIcon = gestures.find((g) => g.ID === id)?.icon;
          const newGestures = gestures.map((g) => {
            if (g.ID === id) {
              g.icon = icon;
            } else if (g.ID !== id && g.icon === icon && currentIcon) {
              g.icon = currentIcon;
            }
            return g;
          });
          setGestures(newGestures, false);
        },

        setRequiredConfidence(id: GestureData["ID"], value: number) {
          const { gestures, setGestures } = get();
          const newGestures = gestures.map((g) => {
            return id !== g.ID ? g : { ...g, requiredConfidence: value };
          });
          setGestures(newGestures, false);
        },

        deleteGestureRecording(
          gestureId: GestureData["ID"],
          recordingIdx: number
        ) {
          const { gestures, setGestures } = get();
          const newGestures = gestures.map((g) => {
            if (gestureId !== g.ID) {
              return g;
            }
            const recordings = g.recordings.filter(
              (_r, i) => i !== recordingIdx
            );
            return { ...g, recordings };
          });
          setGestures(newGestures);
        },

        deleteAllGestures() {
          get().setGestures([]);
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

        loadDataset(gestures: GestureData[]) {
          get().validateAndSetGestures(gestures);
        },

        async trainModel() {
          const { gestures, gesturesLastModified } = get();
          const actionName = "trainModel";
          set(
            {
              mlStatus: { stage: MlStage.TrainingInProgress, progressValue: 0 },
            },
            false,
            actionName
          );
          const trainingResult = await trainModel({
            data: gestures,
            onProgress: (progressValue) =>
              set(
                {
                  mlStatus: {
                    stage: MlStage.TrainingInProgress,
                    progressValue,
                  },
                },
                false,
                actionName
              ),
          });

          const newStatus = trainingResult.error
            ? { stage: MlStage.TrainingError as const }
            : ({
                stage: MlStage.TrainingComplete as const,
                model: trainingResult.model,
              } as const);
          set(
            {
              mlStatus: newStatus,
              ...updateProject(
                get(),
                gestures,
                gesturesLastModified,
                newStatus
              ),
            },
            false,
            actionName
          );
          return newStatus;
        },

        resetProject(): void {
          const {
            project: previousProject,
            gestures,
            gesturesLastModified,
            mlStatus,
          } = get();
          const newProject = {
            ...previousProject,
            text: {
              ...previousProject.text,
              ...generateProject(
                { data: gestures, lastModified: gesturesLastModified },
                mlStatus.stage === MlStage.TrainingComplete
                  ? mlStatus.model
                  : undefined
              ).text,
            },
          };
          set(
            {
              project: newProject,
              projectEdited: false,
              appEditNeedsFlushToEditor: FlushType.Immediate,
            },
            false,
            "resetProject"
          );
        },
        loadProject(project: Project) {
          set(
            {
              project,
              projectEdited: true,
              appEditNeedsFlushToEditor: FlushType.Immediate,
            },
            false,
            "loadProject"
          );
          // We will update the gestures via the editorChange call which will have a new header.
        },
        editorChange(newProject: Project) {
          const actionName = "editorChange";
          const { project: previousProject, isEditorOpen } = get();
          const previousHeader = previousProject?.header?.id;
          const newHeader = newProject.header?.id;
          // Ignore the initial header change when we get assigned one.
          if (previousHeader !== newHeader) {
            if (!previousHeader) {
              // This is the first time MakeCode has loaded the project and it will assign a header.
              return set({ project: newProject }, false, actionName);
            } else {
              // MakeCode has loaded a new hex, update our state to match:
              const datasetString = newProject.text?.[filenames.datasetJson];
              const dataset = datasetString
                ? (JSON.parse(datasetString) as GestureContextState)
                : { data: [], lastModified: Date.now() };
              // This will cause another write to MakeCode but that's OK as it gives us
              // a chance to validate/update the project
              get().validateAndSetGestures(dataset.data);
              set(
                {
                  project: newProject,
                  // New project loaded externally so we can't know whether its edited.
                  projectEdited: true,
                },
                false,
                actionName
              );
            }
          } else if (isEditorOpen) {
            set(
              {
                project: newProject,
                projectEdited: true,
              },
              false,
              actionName
            );
          }
        },
        projectFlushedToEditor() {
          set(
            {
              appEditNeedsFlushToEditor: undefined,
            },
            false,
            "projectFlushedToEditor"
          );
        },
      }),
      {
        name: "ml",
        partialize: ({
          gestures,
          gesturesLastModified,
          project,
          projectEdited,
          mlStatus,
        }) => ({
          gestures,
          gesturesLastModified,
          project,
          projectEdited,
          mlStatus,
        }),
      }
    ),
    { enabled: flags.devtools }
  )
);

// TODO: would be good to load this safely with UI states that wait for it
tf.loadLayersModel(modelUrl)
  .then((model) => {
    if (model) {
      useAppStore.setState(
        {
          mlStatus: { stage: MlStage.TrainingComplete, model },
        },
        false,
        "loadModel"
      );
    }
  })
  .catch(() => {
    // This happens if there's no model.
  });

useAppStore.subscribe((state, prevState) => {
  if (
    state.mlStatus !== prevState.mlStatus &&
    state.mlStatus.stage !== MlStage.TrainingInProgress
  ) {
    const model =
      state.mlStatus.stage === MlStage.TrainingComplete
        ? state.mlStatus.model
        : undefined;
    if (model) {
      model.save(modelUrl).catch(() => {
        // IndexedDB not available?
      });
    } else {
      tf.io.removeModel(modelUrl).catch(() => {
        // No IndexedDB/no model.
      });
    }
  }
});

const updateProject = (
  store: Store,
  gestures: GestureData[],
  gesturesLastModified: number,
  status: MlStatus
): Partial<Store> => {
  const { project: previousProject, projectEdited } = store;
  const model =
    status.stage === MlStage.TrainingComplete ? status.model : undefined;
  const gestureData = { data: gestures, lastModified: gesturesLastModified };
  const updatedProject = {
    ...previousProject,
    text: {
      ...previousProject.text,
      ...(projectEdited
        ? generateCustomFiles(gestureData, model)
        : generateProject(gestureData, model).text),
    },
  };
  return {
    project: updatedProject,
    projectEdited,
    appEditNeedsFlushToEditor: FlushType.Debounced,
  };
};

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

export const useHasSufficientDataForTrainig = (): boolean => {
  const gestures = useAppStore((s) => s.gestures);
  return hasSufficientDataForTraining(gestures);
};

export const useHasNoStoredData = (): boolean => {
  const gestures = useAppStore((s) => s.gestures);
  return !(
    gestures.length !== 0 && gestures.some((g) => g.recordings.length > 0)
  );
};

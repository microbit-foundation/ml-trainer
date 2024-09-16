import uuid4 from "uuid4";
import { Project } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { create } from "zustand";
import {
  DatasetEditorJsonFormat,
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

export interface Store {
  /**
   * UUID for the currently open project.
   * This should match the id field in dataset.json in the MakeCode project if they are the same project.
   *
   * We update this before save.
   */
  version: string;
  gestures: GestureData[];
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

  model: tf.LayersModel | undefined;

  isEditorOpen: boolean;
  appEditNeedsFlushToEditor: boolean;
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

  projectFlushedToEditor(): void;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;
  trainModelFlowStart: () => Promise<void>;
  closeTrainModelDialogs: () => void;
}

const initialId = uuid4();
export const useAppStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        gestures: [],
        version: initialId,
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
          ...generateProject({ data: [], version: initialId }, undefined),
        },
        projectEdited: false,
        settings: defaultSettings,
        model: undefined,
        isEditorOpen: false,
        appEditNeedsFlushToEditor: false,
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
            ({ model }) => {
              gestures =
                // Always have at least one gesture for walk through
                gestures.length === 0
                  ? [get().generateNewGesture(true)]
                  : gestures;

              const modelUpdates = isRetrainNeeded
                ? { model: undefined }
                : { model };
              return {
                gestures,
                ...modelUpdates,
                ...updateProject(get(), gestures, modelUpdates.model),
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
            {
              model,
              trainModelDialogStage: model
                ? TrainModelDialogStage.Closed
                : TrainModelDialogStage.TrainingError,
              ...updateProject(get(), gestures, model),
            },
            false,
            actionName
          );
          return !trainingResult.error;
        },

        resetProject(): void {
          const {
            project: previousProject,
            gestures,
            version: gesturesLastModified,
            model,
          } = get();
          const newProject = {
            ...previousProject,
            text: {
              ...previousProject.text,
              ...generateProject(
                { data: gestures, version: gesturesLastModified },
                model
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
        loadProject(newProject: Project) {
          set(
            {
              project: newProject,
              projectEdited: true,
              appEditNeedsFlushToEditor: true,
            },
            false,
            "loadProject"
          );

          // MakeCode has loaded a new hex, update our state to match:
          const datasetString = newProject.text?.[filenames.datasetJson];
          const dataset = datasetString
            ? (JSON.parse(datasetString) as DatasetEditorJsonFormat)
            : { data: [], lastModified: Date.now() };
          // This will cause another write to MakeCode eventually, but that's OK as it gives us
          // a chance to validate/update the project
          get().validateAndSetGestures(dataset.data);
        },
        editorChange(newProject: Project) {
          const actionName = "editorChange";
          const {
            project: previousProject,
            projectEdited,
            version: id,
            isEditorOpen,
          } = get();
          // This could be a user edit, a spurious change from MakeCode or the user loading a new hex while inside MakeCode
          const datasetString = newProject.text?.[filenames.datasetJson];
          const dataset = datasetString
            ? (JSON.parse(datasetString) as DatasetEditorJsonFormat)
            : { data: [], id: uuid4() };
          if (dataset.version !== id) {
            // It's a new project. Thanks user. We'll update our state.
            // This will cause another write to MakeCode but that's OK as it gives us
            // a chance to validate/update the project
            set(
              {
                project: newProject,
                // New project loaded externally so we can't know whether its edited.
                projectEdited: true,
                version: dataset.version,
              },
              false,
              actionName
            );
            get().validateAndSetGestures(dataset.data);
          } else if (isEditorOpen) {
            set({ project: newProject }, false, actionName);
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
          version: id,
          project,
          projectEdited,
          settings,
        }) => ({
          gestures,
          id,
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

const updateProject = (
  store: Store,
  gestures: GestureData[],
  model: tf.LayersModel | undefined
): Partial<Store> => {
  const { project: previousProject, projectEdited } = store;

  const datasetFile = previousProject.text?.[filenames.datasetJson];
  const id = datasetFile
    ? (JSON.parse(datasetFile) as DatasetEditorJsonFormat).version
    : uuid4();

  const gestureData = { data: gestures, id: id };
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
    appEditNeedsFlushToEditor: true,
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

const isSameProject = (p1: Project, p2: Project) => {
  // We use a very loose definition as this is just to decide if we're OK rewriting it.
  const main1 = p1.text?.[filenames.mainTs];
  const main2 = p2.text?.[filenames.mainTs];
  return main1 === main2;
};

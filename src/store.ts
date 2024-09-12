import * as tf from "@tensorflow/tfjs";
import { Project } from "@microbit/makecode-embed/react";
import { GestureData, RecordingData } from "./gestures-hooks";
import { MlStage, MlStatus } from "./ml-status-hooks";
import { create } from "zustand";
import { generateProject } from "./makecode/utils";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { trainModel } from "./ml";

export const modelUrl = "indexeddb://micro:bit-ml-tool-model";

export interface Store {
  gestures: GestureData[];
  gesturesLastModified: number;
  isRecording: boolean;

  getDefaultIcon(options: {
    isFirstGesture?: boolean;
    iconsInUse?: MakeCodeIcon[];
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

  project: Project;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;

  mlStatus: MlStatus;

  isMakeCodeOpen: boolean;
  openMakeCode(): void;
  closeMakeCode(): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(): void;

  trainModel(): void;
}

// TODO: persistence
export const useAppStore = create<Store>()((set, get) => ({
  gestures: [],
  gesturesLastModified: Date.now(),
  isRecording: false,
  project: generateProject({ data: [], lastModified: Date.now() }, undefined),
  projectEdited: false,
  mlStatus: { stage: MlStage.InsufficientData },
  isMakeCodeOpen: false,

  newSession() {
    get().deleteAllGestures();
  },

  openMakeCode() {
    set({ isMakeCodeOpen: true });
  },

  closeMakeCode() {
    set({ isMakeCodeOpen: false });
  },

  recordingStarted() {
    set({ isRecording: true });
  },
  recordingStopped() {
    set({ isRecording: false });
  },

  getDefaultIcon({
    isFirstGesture,
    iconsInUse,
  }: {
    isFirstGesture?: boolean;
    iconsInUse?: MakeCodeIcon[];
  }): MakeCodeIcon {
    if (isFirstGesture) {
      return defaultIcons[0];
    }
    if (!iconsInUse) {
      iconsInUse = get().gestures.map((g) => g.icon);
    }
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
      icon: get().getDefaultIcon({ isFirstGesture }),
    };
  },

  validateAndSetGestures(gestures: Partial<GestureData>[]) {
    const validGestures: GestureData[] = [];
    const importedGestureIcons: MakeCodeIcon[] = gestures
      .map((g) => g.icon as MakeCodeIcon)
      .filter(Boolean);
    gestures.forEach((g) => {
      if (g.ID && g.name !== undefined && Array.isArray(g.recordings)) {
        if (!g.icon) {
          g.icon = this.getDefaultIcon({
            iconsInUse: [
              ...validGestures.map((g) => g.icon),
              ...importedGestureIcons,
            ],
          });
        }
        validGestures.push(g as GestureData);
      }
    });
    get().setGestures(validGestures);
  },

  setGestures(gestures: GestureData[], isRetrainNeeded: boolean = true) {
    tf.io.removeModel(modelUrl).catch(() => {
      // Throws if there is no model to remove.
    });

    set(({ mlStatus: previousMlStatus }) => {
      gestures =
        // Always have at least one gesture for walk through
        gestures.length === 0 ? [get().generateNewGesture(true)] : gestures;

      const mlStatus = !hasSufficientDataForTraining(gestures)
        ? { stage: MlStage.InsufficientData as const }
        : isRetrainNeeded || previousMlStatus.stage === MlStage.InsufficientData
        ? // Updating status to retrain status is in status hook
          { stage: MlStage.NotTrained as const }
        : previousMlStatus;

      return {
        gestures,
        gesturesLastModified: Date.now(),
        mlStatus,
      };
    });
  },

  addNewGesture() {
    const { gestures, setGestures } = get();
    setGestures([...gestures, get().generateNewGesture()]);
  },

  addGestureRecordings(id: GestureData["ID"], recs: RecordingData[]) {
    const { gestures, setGestures } = get();
    const newGestures = gestures.map((g) => {
      return id !== g.ID ? g : { ...g, recordings: [...recs, ...g.recordings] };
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

  deleteGestureRecording(gestureId: GestureData["ID"], recordingIdx: number) {
    const { gestures, setGestures } = get();
    const newGestures = gestures.map((g) => {
      if (gestureId !== g.ID) {
        return g;
      }
      const recordings = g.recordings.filter((_r, i) => i !== recordingIdx);
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

  async trainModel() {
    const { gestures } = get();
    set({ mlStatus: { stage: MlStage.TrainingInProgress, progressValue: 0 } });
    const trainingResult = await trainModel({
      data: gestures,
      onProgress: (progressValue) =>
        set({ mlStatus: { stage: MlStage.TrainingInProgress, progressValue } }),
    });

    if (trainingResult.error) {
      set({ mlStatus: { stage: MlStage.TrainingError } });
    } else {
      set({
        mlStatus: {
          stage: MlStage.TrainingComplete,
          model: trainingResult.model,
        },
      });
      // TODO: maybe move to middleware?
      trainingResult.model.save(modelUrl).catch(() => {
        // IndexedDB not available?
      });
      return trainingResult;
    }
  },
}));

export const useHasGestures = () => {
  const gestures = useAppStore((s) => s.gestures);
  return (
    (gestures.length > 0 && gestures[0].name.length > 0) ||
    gestures[0].recordings.length > 0
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

import { createContext, ReactNode, useContext, useMemo } from "react";
import { useStorage } from "./use-storage";
import {
  MlStage,
  MlStatus,
  TrainingCompleteMlStatus,
  useMlStatus,
} from "./use-ml-status";
import { isArray } from "../utils/validators";
import { defaultIcons, MakeCodeIcon } from "../utils/icons";
import { useProject } from "./use-project";
import { LayersModel } from "@tensorflow/tfjs";
export interface XYZData {
  x: number[];
  y: number[];
  z: number[];
}

interface RecordingData {
  ID: number;
  data: XYZData;
}

export interface Gesture {
  name: string;
  ID: number;
  icon: MakeCodeIcon;
  recordings: RecordingData[];
  requiredConfidence?: number;
}

type GestureContext = [Gesture[], (gestures: Gesture[]) => void];

// Exported for testing
export const isValidGestureData = (v: unknown): v is Gesture[] => {
  if (!isArray(v)) {
    return false;
  }
  const array = v as unknown[];
  for (const item of array) {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    if (
      !("name" in item) ||
      !("ID" in item) ||
      !("recordings" in item) ||
      !isArray(item.recordings)
    ) {
      return false;
    }
    const recordings = item.recordings as unknown[];
    for (const rec of recordings) {
      if (typeof rec !== "object" || rec === null) {
        return false;
      }
      if (!("data" in rec) || !("ID" in rec) || isArray(rec.data)) {
        return false;
      }
      const xyzData = rec.data as object;
      if (
        !("x" in xyzData) ||
        !("y" in xyzData) ||
        !("z" in xyzData) ||
        !isArray(xyzData.x) ||
        !isArray(xyzData.y) ||
        !isArray(xyzData.z)
      ) {
        return false;
      }
    }
  }
  return true;
};

const GestureContext = createContext<GestureContext | undefined>(undefined);

export const useGestures = (): GestureContext => {
  const gestures = useContext(GestureContext);
  if (!gestures) {
    throw new Error("Missing provider");
  }
  return gestures;
};

export const GesturesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useStorage<Gesture[]>(
    "local",
    "gestures",
    [],
    isValidGestureData
  );
  return (
    <GestureContext.Provider value={[state, setState]}>
      {children}
    </GestureContext.Provider>
  );
};

export const useGestureActions = () => {
  const [gestures, setGestures] = useGestures();
  const [status, setStatus] = useMlStatus();
  const { updateProject } = useProject();
  const actions = useMemo<GestureActions>(
    () =>
      new GestureActions(
        gestures,
        setGestures,
        status,
        setStatus,
        updateProject
      ),
    [gestures, setGestures, setStatus, status, updateProject]
  );

  return actions;
};

class GestureActions {
  constructor(
    private gestures: Gesture[],
    private setGestures: (gestures: Gesture[]) => void,
    private status: MlStatus,
    private setStatus: (status: MlStatus) => void,
    private updateProject: (
      gestures: Gesture[],
      model: LayersModel | undefined
    ) => void
  ) {
    // Initialize with at least one gesture for walkthrough.
    if (!this.gestures.length) {
      this.setGestures([this.generateNewGesture(true)]);
    }
  }

  private getDefaultIcon = ({
    isFirstGesture,
    iconsInUse,
  }: {
    isFirstGesture?: boolean;
    iconsInUse?: MakeCodeIcon[];
  }): MakeCodeIcon => {
    if (isFirstGesture) {
      return defaultIcons[0];
    }
    if (!iconsInUse) {
      iconsInUse = this.gestures.map((g) => g.icon);
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
  };

  private generateNewGesture = (isFirstGesture: boolean = false): Gesture => ({
    name: "",
    recordings: [],
    ID: Date.now(),
    icon: this.getDefaultIcon({ isFirstGesture }),
  });

  hasGestures = (): boolean => {
    return (
      this.gestures.length > 0 &&
      (this.gestures[0].name.length > 0 ||
        this.gestures[0].recordings.length > 0)
    );
  };

  importGestures = (gestures: Partial<Gesture>[]) => {
    const validGestures: Gesture[] = [];
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
        validGestures.push(g as Gesture);
      }
    });
    this.setGesturesInternal(validGestures);
  };

  private setGesturesInternal = (
    gestures: Gesture[],
    isRetrainNeeded: boolean = true
  ) => {
    const data =
      // Always have at least one gesture for walk through
      gestures.length === 0 ? [this.generateNewGesture(true)] : gestures;
    this.setGestures(data);

    // Update training status
    const newTrainingStatus = !hasSufficientDataForTraining(data)
      ? { stage: MlStage.InsufficientData as const }
      : isRetrainNeeded || this.status.stage === MlStage.InsufficientData
      ? // Updating status to retrain status is in status hook
        { stage: MlStage.NotTrained as const }
      : this.status;

    this.setStatus(newTrainingStatus);
    this.updateProject(
      data,
      (newTrainingStatus as TrainingCompleteMlStatus).model
    );
  };

  addNewGesture = () => {
    this.setGesturesInternal([...this.gestures, this.generateNewGesture()]);
  };

  addGestureRecordings = (id: Gesture["ID"], recs: RecordingData[]) => {
    const newGestures = this.gestures.map((g) => {
      return id !== g.ID ? g : { ...g, recordings: [...recs, ...g.recordings] };
    });
    this.setGesturesInternal(newGestures);
  };

  deleteGesture = (id: Gesture["ID"]) => {
    this.setGesturesInternal(this.gestures.filter((g) => g.ID !== id));
  };

  setGestureName = (id: Gesture["ID"], name: string) => {
    const newGestures = this.gestures.map((g) => {
      return id !== g.ID ? g : { ...g, name };
    });
    this.setGesturesInternal(newGestures, false);
  };

  setGestureIcon = (id: Gesture["ID"], icon: MakeCodeIcon) => {
    const currentIcon = this.gestures.find((g) => g.ID === id)?.icon;
    const newGestures = this.gestures.map((g) => {
      if (g.ID === id) {
        g.icon = icon;
      } else if (g.ID !== id && g.icon === icon && currentIcon) {
        g.icon = currentIcon;
      }
      return g;
    });
    this.setGesturesInternal(newGestures, false);
  };

  setRequiredConfidence = (id: Gesture["ID"], value: number) => {
    const newGestures = this.gestures.map((g) => {
      return id !== g.ID ? g : { ...g, requiredConfidence: value };
    });
    this.setGesturesInternal(newGestures, false);
  };

  deleteGestureRecording = (gestureId: Gesture["ID"], recordingIdx: number) => {
    const newGestures = this.gestures.map((g) => {
      if (gestureId !== g.ID) {
        return g;
      }
      const recordings = g.recordings.filter((_r, i) => i !== recordingIdx);
      return { ...g, recordings };
    });
    this.setGesturesInternal(newGestures);
  };

  deleteAllGestures = () => {
    this.setGesturesInternal([]);
  };

  downloadDataset = () => {
    const a = document.createElement("a");
    a.setAttribute(
      "href",
      "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(this.gestures, null, 2))
    );
    a.setAttribute("download", "dataset");
    a.style.display = "none";
    a.click();
  };
}

export const hasSufficientDataForTraining = (gestures: Gesture[]): boolean => {
  return (
    gestures.length >= 2 && gestures.every((g) => g.recordings.length >= 3)
  );
};

import { createContext, ReactNode, useContext, useMemo } from "react";
import { useStorage } from "./hooks/use-storage";
import { MlStage, MlStatus, useMlStatus } from "./ml-status-hooks";
import { isArray } from "./utils";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
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
  requiredConfidence?: number;
}

export interface GestureData extends Gesture {
  recordings: RecordingData[];
}

export interface GestureContextState {
  data: GestureData[];
}

type GestureContextValue = [
  GestureContextState,
  (gestureData: GestureContextState) => void
];

// Exported for testing
export const isValidStoredGestureData = (
  v: unknown
): v is GestureContextState => {
  if (typeof v !== "object") {
    return false;
  }
  const valueObject = v as object;
  if (!("data" in valueObject)) {
    return false;
  }
  const data = valueObject.data;
  if (!isArray(data)) {
    return false;
  }
  const array = data as unknown[];
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

const GestureContext = createContext<GestureContextValue | undefined>(
  undefined
);

export const useGestureData = (): GestureContextValue => {
  const gestureData = useContext(GestureContext);
  if (!gestureData) {
    throw new Error("Missing provider");
  }
  return gestureData;
};

export const GesturesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useStorage<GestureContextState>(
    "local",
    "gestures",
    { data: [] },
    isValidStoredGestureData
  );
  return (
    <GestureContext.Provider value={[state, setState]}>
      {children}
    </GestureContext.Provider>
  );
};

export const useGestureActions = () => {
  const [gestures, setGestures] = useGestureData();
  const [status, setStatus] = useMlStatus();
  const actions = useMemo<GestureActions>(
    () => new GestureActions(gestures, setGestures, status, setStatus),
    [gestures, setGestures, setStatus, status]
  );

  return actions;
};

class GestureActions {
  constructor(
    private gestureState: GestureContextState,
    private setGestureState: (gestureData: GestureContextState) => void,
    private status: MlStatus,
    private setStatus: (status: MlStatus) => void
  ) {
    // Initialize with at least one gesture for walkthrough.
    if (!this.gestureState.data.length) {
      this.setGestureState({ data: [this.generateNewGesture(true)] });
    }
    // If icon is missing from stored data, generate default icons.
    if (this.gestureState.data.some((g) => !g.icon)) {
      this.validateAndSetGestures(this.gestureState.data);
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
      iconsInUse = this.gestureState.data.map((g) => g.icon);
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

  private generateNewGesture = (
    isFirstGesture: boolean = false
  ): GestureData => ({
    name: "",
    recordings: [],
    ID: Date.now(),
    icon: this.getDefaultIcon({ isFirstGesture }),
  });

  hasGestures = (): boolean => {
    return (
      this.gestureState.data.length > 0 &&
      (this.gestureState.data[0].name.length > 0 ||
        this.gestureState.data[0].recordings.length > 0)
    );
  };

  validateAndSetGestures = (gestures: Partial<GestureData>[]) => {
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
    this.setGestures(validGestures);
  };

  setGestures = (gestures: GestureData[], isRetrainNeeded: boolean = true) => {
    const data =
      // Always have at least one gesture for walk through
      gestures.length === 0 ? [this.generateNewGesture(true)] : gestures;
    this.setGestureState({ data });

    // Update training status
    const newTrainingStatus = !hasSufficientDataForTraining(data)
      ? { stage: MlStage.InsufficientData as const }
      : isRetrainNeeded || this.status.stage === MlStage.InsufficientData
      ? // Updating status to retrain status is in status hook
        { stage: MlStage.NotTrained as const }
      : this.status;

    this.setStatus(newTrainingStatus);
  };

  addNewGesture = () => {
    this.setGestures([...this.gestureState.data, this.generateNewGesture()]);
  };

  addGestureRecordings = (id: GestureData["ID"], recs: RecordingData[]) => {
    const newGestures = this.gestureState.data.map((g) => {
      return id !== g.ID ? g : { ...g, recordings: [...recs, ...g.recordings] };
    });
    this.setGestures(newGestures);
  };

  deleteGesture = (id: GestureData["ID"]) => {
    this.setGestures(this.gestureState.data.filter((g) => g.ID !== id));
  };

  setGestureName = (id: GestureData["ID"], name: string) => {
    const newGestures = this.gestureState.data.map((g) => {
      return id !== g.ID ? g : { ...g, name };
    });
    this.setGestures(newGestures, false);
  };

  setGestureIcon = (id: GestureData["ID"], icon: MakeCodeIcon) => {
    const currentIcon = this.gestureState.data.find((g) => g.ID === id)?.icon;
    const newGestures = this.gestureState.data.map((g) => {
      if (g.ID === id) {
        g.icon = icon;
      } else if (g.ID !== id && g.icon === icon && currentIcon) {
        g.icon = currentIcon;
      }
      return g;
    });
    this.setGestures(newGestures, false);
  };

  setRequiredConfidence = (id: GestureData["ID"], value: number) => {
    const newGestures = this.gestureState.data.map((g) => {
      return id !== g.ID ? g : { ...g, requiredConfidence: value };
    });
    this.setGestures(newGestures, false);
  };

  deleteGestureRecording = (
    gestureId: GestureData["ID"],
    recordingIdx: number
  ) => {
    const newGestures = this.gestureState.data.map((g) => {
      if (gestureId !== g.ID) {
        return g;
      }
      const recordings = g.recordings.filter((_r, i) => i !== recordingIdx);
      return { ...g, recordings };
    });
    this.setGestures(newGestures);
  };

  deleteAllGestures = () => {
    this.setGestures([]);
  };

  downloadDataset = () => {
    const a = document.createElement("a");
    a.setAttribute(
      "href",
      "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(this.gestureState.data, null, 2))
    );
    a.setAttribute("download", "dataset");
    a.style.display = "none";
    a.click();
  };
}

export const hasSufficientDataForTraining = (
  gestures: GestureData[]
): boolean => {
  return (
    gestures.length >= 2 && gestures.every((g) => g.recordings.length >= 3)
  );
};

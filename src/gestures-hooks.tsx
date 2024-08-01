import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { useStorage } from "./hooks/use-storage";
import { MlStage, MlStatus, useMlStatus } from "./ml-status-hooks";
import { isArray } from "./utils";
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
  threshold?: number;
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

const generateNewGesture = (): GestureData => ({
  name: "",
  recordings: [],
  ID: Date.now(),
});

const initialGestureContextState: GestureContextState = {
  data: [generateNewGesture()],
};

export const GesturesProvider = ({ children }: { children: ReactNode }) => {
  const [storedState, setStoredState] = useStorage<GestureContextState>(
    "local",
    "gestures",
    initialGestureContextState,
    isValidStoredGestureData
  );
  const [state, setState] = useState<GestureContextState>({
    data: storedState.data,
  });
  const setStates = (newState: GestureContextState) => {
    setStoredState({
      ...newState,
      data: newState.data.map(({ name, recordings, ID }) => ({
        name,
        recordings,
        ID,
      })),
    });
    setState(newState);
  };
  return (
    <GestureContext.Provider value={[state, setStates]}>
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
  ) {}

  hasGestures = (): boolean => {
    return (
      this.gestureState.data.length > 0 &&
      (this.gestureState.data[0].name.length > 0 ||
        this.gestureState.data[0].recordings.length > 0)
    );
  };

  setGestures = (gestures: GestureData[], isRetrainNeeded: boolean = true) => {
    const data =
      // Always have at least one gesture for walk through
      gestures.length === 0 ? initialGestureContextState.data : gestures;
    this.setGestureState({ ...this.gestureState, data });

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
    this.setGestures([...this.gestureState.data, generateNewGesture()]);
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

  setGestureThreshold = (id: GestureData["ID"], value: number) => {
    const newGestures = this.gestureState.data.map((g) => {
      return id !== g.ID ? g : { ...g, threshold: value };
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

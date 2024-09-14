import { MakeCodeIcon } from "./utils/icons";

export interface XYZData {
  x: number[];
  y: number[];
  z: number[];
}

export interface RecordingData {
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

export interface DatasetEditorJsonFormat {
  data: GestureData[];
  lastModified: number;
}

export type DatasetUserFileFormat = GestureData[];

// Exported for testing
export const isDatasetUserFileFormat = (
  v: unknown
): v is DatasetUserFileFormat => {
  if (!Array.isArray(v)) {
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
      !Array.isArray(item.recordings)
    ) {
      return false;
    }
    const recordings = item.recordings as unknown[];
    for (const rec of recordings) {
      if (typeof rec !== "object" || rec === null) {
        return false;
      }
      if (!("data" in rec) || !("ID" in rec) || Array.isArray(rec.data)) {
        return false;
      }
      const xyzData = rec.data as object;
      if (
        !("x" in xyzData) ||
        !("y" in xyzData) ||
        !("z" in xyzData) ||
        !Array.isArray(xyzData.x) ||
        !Array.isArray(xyzData.y) ||
        !Array.isArray(xyzData.z)
      ) {
        return false;
      }
    }
  }
  return true;
};

export const enum TrainModelDialogStage {
  Closed,
  ShowingIntroduction,
  TrainingError,
  TrainingInProgress,
}

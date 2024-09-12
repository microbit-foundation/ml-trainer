import { isArray } from "./utils";
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

export interface GestureContextState {
  data: GestureData[];
  lastModified: number;
}

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

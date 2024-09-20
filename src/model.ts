import { MicrobitWebUSBConnection } from "@microbit/microbit-connection";
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

export interface HexData {
  /**
   * Hex data.
   */
  hex: string;
  /**
   * Filename without the .hex extension.
   */
  name: string;
}

export interface HexUrl {
  url: string;

  /**
   * Filename without the .hex extension.
   */
  name: string;
}

export const enum TrainModelDialogStage {
  Closed,
  InsufficientData,
  Help,
  TrainingError,
  TrainingInProgress,
}

export enum DownloadStep {
  None = "None",
  Help = "Introduction",
  ChooseSameOrAnotherMicrobit = "ChooseSameOrAnotherMicrobit",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  FlashingInProgress = "FlashingInProgress",
  ManualFlashingTutorial = "ManualFlashingTutorial",
}

export enum MicrobitToFlash {
  // No micro:bit is connected.
  Default = "default",
  // Same as the connected micro:bit.
  Same = "same",
  // Different from the connected micro:bit.
  Different = "different",
}

export interface DownloadState {
  step: DownloadStep;
  microbitToFlash: MicrobitToFlash;
  flashProgress: number;
  hex?: HexData;
  // The micro:bit used to flash the hex.  We remember your choice for easy code
  // iteration for as long as the editor is open.
  usbDevice?: MicrobitWebUSBConnection;
}

export interface SaveState {
  step: SaveStep;
  hex?: HexData;
}

export enum SaveStep {
  None = "none",
  PreSaveHelp = "help",
  /**
   * We only show this state if we initiated the save and need to wait for the editor.
   * Otherwise we already have the project data in the state and save it directly.
   */
  SaveProgress = "progress",
}

export enum GuidedTour {
  None = "none",
  DataSamplesPage = "data samples page",
  HowToTrainModel = "HowToTrainModel",
  HowToTestModel = "HowToTestModel",
}

import { MicrobitWebUSBConnection } from "@microbit/microbit-connection";
import { MakeCodeIcon } from "./utils/icons";
import { ReactNode } from "react";
import { SpotlightStyle } from "./pages/TourOverlay";
import { PlacementWithLogical, ThemingProps } from "@chakra-ui/react";

export interface XYZData {
  x: number[];
  y: number[];
  z: number[];
}

export interface RecordingData {
  ID: number;
  data: XYZData;
}

export interface Action {
  name: string;
  ID: number;
  icon: MakeCodeIcon;
  requiredConfidence?: number;
}

export interface ActionData extends Action {
  recordings: RecordingData[];
}

export interface DatasetEditorJsonFormat {
  data: ActionData[];
}

export type DatasetUserFileFormat = ActionData[];

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
  None = "none",
  Help = "introduction",
  ChooseSameOrDifferentMicrobit = "choose same or different microbit",
  ConnectCable = "connect cable",
  ConnectRadioRemoteMicrobit = "connect radio remote microbit",
  WebUsbFlashingTutorial = "web usb flashing tutorial",
  WebUsbChooseMicrobit = "web usb choose microbit",
  FlashingInProgress = "flashing in progress",
  ManualFlashingTutorial = "manual flashing tutorial",
  UnplugRadioBridgeMicrobit = "unplug radio bridge microbit",
  IncompatibleDevice = "incompatible device",
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
  ProjectName = "project name",
  /**
   * We only show this state if we initiated the save and need to wait for the editor.
   * Otherwise we already have the project data in the state and save it directly.
   */
  SaveProgress = "progress",
}

export interface TourStep {
  selector?: string;
  title: ReactNode;
  content: ReactNode;
  spotlightStyle?: SpotlightStyle;
  modalSize?: ThemingProps<"Modal">["size"];
  placement?: PlacementWithLogical;
}

export interface TourState {
  steps: TourStep[];
  index: number;
  markCompleted: TourTriggerName[];
}

export const tourSequence: TourTriggerName[] = [
  "Connect",
  "DataSamplesRecorded",
  "TrainModel",
  "MakeCode",
];

export type TourTriggerName =
  | "Connect"
  | "DataSamplesRecorded"
  | "TrainModel"
  | "MakeCode";

export type TourTrigger =
  | { name: "Connect" }
  | { name: "MakeCode" }
  | { name: "TrainModel"; delayedUntilConnection: boolean }
  | { name: "DataSamplesRecorded"; recordingCount: number };

/**
 * Information passed omn the URL from microbit.org.
 * We call back into microbit.org to grab a JSON file with
 * full details.
 */
export type MicrobitOrgResource = {
  /**
   * ID that can be used when fetching the code from microbit.org.
   */
  id: string;

  /**
   * Name of the microbit.org project or lesson.
   *
   * We use this to load the target code.
   */
  project: string;

  /**
   * Name of the actual code snippet.
   * Due to a data issue this can often be the same as the project name.
   */
  name: string;
};

export enum DataSamplesView {
  Graph = "graph",
  DataFeatures = "data features",
  GraphAndDataFeatures = "graph and data features",
}

export enum PostImportDialogState {
  None = "none",
  Error = "error",
  NonCreateAiHex = "non create ai hex dialog",
}

export type EditorStartUp = "in-progress" | "timed out" | "done";

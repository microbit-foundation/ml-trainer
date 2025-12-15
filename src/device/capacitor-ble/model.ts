export enum FlashResult {
  MissingPermissions = "MissingPermissions",
  BluetoothDisabled = "BluetoothDisabled",
  DeviceNotFound = "DeviceNotFound",
  FailedToConnect = "FailedToConnect",
  InvalidHex = "InvalidHex",
  FullFlashFailed = "FullFlashFailed",
  PartialFlashFailed = "PartialFlashFailed",
  Cancelled = "Cancelled",
  Success = "Success",
}

export enum FlashProgressStage {
  Initialize = "Initialize",
  FindDevice = "FindDevice",
  Bond = "Bond",
  Connecting = "Connecting",
  Partial = "PartialFlashing",
  Full = "FullFlashing",
}

export type Progress = (
  progressStage: FlashProgressStage,
  progress?: number
) => void;

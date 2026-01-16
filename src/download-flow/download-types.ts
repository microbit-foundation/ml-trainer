import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { HexData } from "../model";

/**
 * Steps in the flow to download a hex from MakeCode.
 *
 * For web bluetooth users we offer a choice of same/different micro:bit.
 *
 * Radio bridge users are carefully led through a flow to flash the data collection
 * micro:bit (not the bridge) as that's the one they've been moving.
 *
 * Native bluetooth users use the same micro:bit for now.
 *
 * Note: The flow to download the data collection hex is part of ConnectionFlowStep.
 */
export enum DownloadStep {
  None = "None",
  Help = "Help",
  ChooseSameOrDifferentMicrobit = "ChooseSameOrDifferentMicrobit",

  // WebUSB/radio
  ConnectCable = "ConnectCable",
  ConnectRadioRemoteMicrobit = "ConnectRadioRemoteMicrobit",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",

  // Bluetooth (native only for download). There's a good chance we can skip
  // connection steps because we'll already be connected.
  BluetoothPattern = "BluetoothPattern",
  NativeBluetoothPreConnectTutorial = "NativeBluetoothPreConnectTutorial",
  BluetoothSearchConnect = "BluetoothSearchConnect",

  // Common
  IncompatibleDevice = "IncompatibleDevice",
  FlashingInProgress = "FlashingInProgress",

  // WebUSB/radio
  ManualFlashingTutorial = "ManualFlashingTutorial",
  UnplugRadioBridgeMicrobit = "UnplugRadioBridgeMicrobit",
}

export enum SameOrDifferentChoice {
  // No micro:bit is connected.
  Default = "default",
  // Same as the connected micro:bit.
  Same = "same",
  // Different from the connected micro:bit.
  Different = "different",
}

export interface DownloadState {
  step: DownloadStep;
  microbitChoice: SameOrDifferentChoice;
  hex?: HexData;
  /**
   * We populate this from the connection.
   * If the connection is connected we'll just go ahead and use it.
   * If the connection is not provided we'll collect this in the flow.
   */
  bluetoothMicrobitName?: string;
  /**
   * The micro:bit used to flash the hex.
   * We remember your choice for easy repeated flashes for as long as the editor is open.
   */
  connection?: MicrobitWebUSBConnection | MicrobitWebBluetoothConnection;
}

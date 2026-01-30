import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { BluetoothPairingMethod } from "../data-connection-flow/data-connection-types";
import { HexData } from "../model";
import { PermissionStep } from "../shared-steps";

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
 *
 * Using const object pattern with string literal union types.
 */
export const DownloadStep = {
  None: "None",
  Help: "Help",
  ChooseSameOrDifferentMicrobit: "ChooseSameOrDifferentMicrobit",

  // WebUSB/radio
  ConnectCable: "ConnectCable",
  WebUsbFlashingTutorial: "WebUsbFlashingTutorial",
  ConnectRadioRemoteMicrobit: "ConnectRadioRemoteMicrobit",
  ManualFlashingTutorial: "ManualFlashingTutorial",

  // Bluetooth (native only for download)
  EnterBluetoothPattern: "EnterBluetoothPattern",
  NativeCompareBluetoothPattern: "NativeCompareBluetoothPattern",
  NativeBluetoothPreConnectTutorial: "NativeBluetoothPreConnectTutorial",
  NativeBluetoothPreConnectTroubleshooting:
    "NativeBluetoothPreConnectTroubleshooting",
  PairingLost: "PairingLost",
  BluetoothSearchConnect: "BluetoothSearchConnect",

  // Common
  FlashingInProgress: "FlashingInProgress",
  IncompatibleDevice: "IncompatibleDevice",
  ConnectFailed: "ConnectFailed",

  // WebUSB/radio
  UnplugRadioBridgeMicrobit: "UnplugRadioBridgeMicrobit",

  // Permission error steps (shared with data connection flow)
  ...PermissionStep,
} as const;

export type DownloadStep = (typeof DownloadStep)[keyof typeof DownloadStep];

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
   * The micro:bit used to flash the hex.
   * We remember your choice for easy repeated flashes for as long as the editor is open.
   */
  connection?: MicrobitWebUSBConnection | MicrobitWebBluetoothConnection;
  /**
   * Which pairing method variant to show in the Bluetooth tutorial dialog.
   */
  pairingMethod: BluetoothPairingMethod;
  /**
   * True while a permission check is in progress (native Bluetooth only).
   * Used to show loading state on "Try Again" button in permission error dialogs.
   */
  isCheckingPermissions: boolean;

  /**
   * Abort controller for aborting the connection process.
   * If `undefined`, there is no process to abort.
   */
  connectionAbortController: AbortController | undefined;
}

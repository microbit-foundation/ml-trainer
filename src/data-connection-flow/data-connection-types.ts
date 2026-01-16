/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { isNativePlatform } from "../platform";
import { ConnectionTransport } from "../connection-service";

export enum DataConnectionType {
  /**
   * This connection flow first flashes over WebUSB (with manual fallback)
   * and then connects over bluetooth.
   */
  WebBluetooth = "WebBluetooth",
  /**
   * This is a native-app bluetooth only connection flow that flashes over
   * bluetooth and then reconnects to the flashed device.
   */
  NativeBluetooth = "NativeBluetooth",
  /**
   * Radio bridge connection flow. Flashes the remote micro:bit first, then
   * the bridge micro:bit, and connects them over radio.
   */
  Radio = "Radio",
}

/**
 * Tracks the current phase within the radio connection flow.
 * - "remote": Flashing the data collection micro:bit (first half)
 * - "bridge": Flashing the bridge micro:bit (second half)
 */
export type RadioFlowPhase = "remote" | "bridge";

export const dataConnectionTypeToTransport = (
  type: DataConnectionType
): ConnectionTransport => {
  switch (type) {
    case DataConnectionType.NativeBluetooth:
    case DataConnectionType.WebBluetooth:
      return "bluetooth";
    case DataConnectionType.Radio:
      return "radio";
  }
};

export enum DataConnectionStep {
  /**
   * Idle/not started - no connection flow dialog open, no device monitoring.
   */
  Idle = "Idle",
  /**
   * Successfully connected - device is ready to use.
   */
  Connected = "Connected",

  // Happy flow stages.
  Start = "Start",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  ManualFlashingTutorial = "ManualFlashingTutorial",
  ConnectBattery = "ConnectBattery",
  BluetoothPattern = "BluetoothPattern",
  WebBluetoothPreConnectTutorial = "WebBluetoothPreConnectTutorial",
  /**
   * Reset to pairing mode.
   */
  NativeBluetoothPreConnectTutorial = "NativeBluetoothPreConnectTutorial",

  // Transient stages (not user-controlled, not navigable).
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  BluetoothConnect = "BluetoothConnect",
  ConnectingMicrobits = "ConnectingMicrobits",
  FlashingInProgress = "FlashingInProgress",

  // Failure stages.
  TryAgainReplugMicrobit = "TryAgainReplugMicrobit",
  TryAgainCloseTabs = "TryAgainCloseTabs",
  TryAgainWebUsbSelectMicrobit = "TryAgainWebUsbSelectMicrobit",
  TryAgainBluetoothSelectMicrobit = "TryAgainBluetoothSelectMicrobit",
  ConnectFailed = "ConnectFailed",
  BadFirmware = "BadFirmware",
  MicrobitUnsupported = "MicrobitUnsupported",
  WebUsbBluetoothUnsupported = "WebUsbBluetoothUnsupported",

  ConnectionLost = "ConnectionLost",
  StartOver = "StartOver",
}

export interface DataConnectionState {
  // For connection flow.
  type: DataConnectionType;
  step: DataConnectionStep;

  // Compatibility.
  isWebBluetoothSupported: boolean;
  isWebUsbSupported: boolean;

  // Connection state.
  bluetoothMicrobitName?: string;
  radioBridgeDeviceId?: number;
  radioRemoteDeviceId?: number;

  /**
   * True if user connected successfully in this session.
   * Reset when user cancels or starts over. Used to determine if this is a
   * reconnection scenario (skip flow, show "reconnect" text on errors).
   */
  hadSuccessfulConnection: boolean;

  /**
   * True when an auto or explicit reconnection is in progress.
   * Used by UI to show reconnecting indicator without changing step.
   */
  isReconnecting: boolean;

  /**
   * Tracks whether we've already failed once during connection/reconnection.
   * When true, the next failure will show the "start over" dialog.
   * Reset when user proceeds from "start over" dialog or connects successfully.
   */
  hasFailedOnce: boolean;

  /**
   * True when user is restarting the flow from the StartOver state.
   * Used for back navigation to return to StartOver instead of Start.
   */
  isStartingOver: boolean;

  /**
   * Browser tab visibility - used to defer error states while user is away.
   */
  isBrowserTabVisible: boolean;

  /**
   * Tracks whether the last disconnect was from the bridge or remote micro:bit.
   * Used by error dialogs to show appropriate recovery instructions.
   */
  lastDisconnectSource?: "bridge" | "remote";

  /**
   * Tracks the current phase within the radio connection flow.
   * Only meaningful when type is Radio.
   */
  radioFlowPhase?: RadioFlowPhase;

  /**
   * Tracks whether the user has explicitly switched connection type (e.g., from
   * Bluetooth to Radio). Used to preserve their choice even if they haven't
   * successfully connected yet.
   */
  hasSwitchedConnectionType: boolean;
}

/**
 * Determines the connection flow type based on platform capabilities.
 * Defaults to WebBluetooth if supported, otherwise Radio.
 */
export const getInitialDataConnectionType = (
  isWebBluetoothSupported: boolean
): DataConnectionType => {
  if (isNativePlatform()) {
    return DataConnectionType.NativeBluetooth;
  }
  // Default to WebBluetooth if supported
  if (isWebBluetoothSupported) {
    return DataConnectionType.WebBluetooth;
  }
  return DataConnectionType.Radio;
};

/**
 * Get initial data connection state.
 * Called at store creation time.
 */
export const getInitialDataConnectionState = (): DataConnectionState => {
  // At store init time, we don't have web bluetooth/usb support info yet.
  // These will be updated when the provider initializes.
  return {
    step: DataConnectionStep.Idle,
    // This value will be replaced before it is used.
    type: DataConnectionType.WebBluetooth,
    isWebBluetoothSupported: false,
    isWebUsbSupported: false,
    hadSuccessfulConnection: false,
    hasSwitchedConnectionType: false,
    isReconnecting: false,
    hasFailedOnce: false,
    isStartingOver: false,
    isBrowserTabVisible: document.visibilityState === "visible",
  };
};

/**
 * Returns true if the connection flow dialog should be open.
 * The dialog is shown for all steps except Idle (not started) and Connected (success).
 */
export const isDataConnectionDialogOpen = (step: DataConnectionStep): boolean =>
  step !== DataConnectionStep.Idle && step !== DataConnectionStep.Connected;

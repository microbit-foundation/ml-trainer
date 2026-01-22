/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  BoardVersion,
  ConnectionStatus as DeviceConnectionStatus,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { DataConnectionType } from "../data-connection-flow";
import { isNativeBluetoothConnection } from "../device/connection-utils";
import { DownloadStep, SameOrDifferentChoice } from "./download-types";
import { always, FlowDefinition } from "../state-machine";
import { HexData } from "../model";

export type DownloadEvent =
  | { type: "start"; hex: HexData }
  | { type: "next"; skipHelpNextTime?: boolean }
  | { type: "back" }
  | { type: "close" }
  | { type: "choseSame" }
  | { type: "choseDifferent" }
  | { type: "setMicrobitName"; name: string }
  | { type: "connectFlashSuccess"; boardVersion: "V1" | "V2" }
  | { type: "connectFlashFailure"; code?: string }
  | { type: "flashSuccess" }
  | { type: "flashFailure"; code?: string }
  // Permission check result events (native Bluetooth only).
  | { type: "permissionsOk" }
  | { type: "bluetoothDisabled" }
  | { type: "permissionDenied" }
  | { type: "locationDisabled" }
  // Permission dialog events.
  | { type: "tryAgain" };

export type DownloadAction =
  | /**
   * Sets hex from start event and initializes bluetooth name filter from settings.
   */
  { type: "initializeDownload" }
  | { type: "setMicrobitChoice"; choice: SameOrDifferentChoice }
  /**
   * Saves showPreDownloadHelp setting from next event.
   */
  | { type: "saveHelpPreference" }
  /**
   * Sets micro:bit name from setMicrobitName event (user input).
   */
  | { type: "setMicrobitName" }
  | { type: "connectFlash" }
  | { type: "flash" }
  | { type: "downloadHexFile" }
  | { type: "disconnectDataConnection" }
  /**
   * Check Bluetooth permissions (native Bluetooth only).
   * Sends permissionsOk, bluetoothDisabled, permissionDenied, or locationDisabled events.
   */
  | { type: "checkPermissions" }
  /**
   * Set the checking permissions flag (native Bluetooth only).
   * Used to show loading state on "Try Again" button.
   */
  | { type: "setCheckingPermissions"; value: boolean }
  /**
   * Initialize flashing progress to Initializing stage.
   * Used as entry action for FlashingInProgress state.
   */
  | { type: "initializeFlashingProgress" };

export interface DownloadFlowContext {
  hex?: HexData;
  microbitChoice: SameOrDifferentChoice;
  bluetoothMicrobitName?: string;
  connection?: MicrobitWebUSBConnection | MicrobitWebBluetoothConnection;

  // Injected from external state.
  showPreDownloadHelp: boolean;
  hadSuccessfulConnection: boolean;
  dataConnectionType: DataConnectionType;
  isUsbConnected: boolean;
  connectedBoardVersion?: BoardVersion;
}

export type DownloadFlowDefinition = FlowDefinition<
  DownloadStep,
  DownloadEvent,
  DownloadAction,
  DownloadFlowContext
>;

// =============================================================================
// Guards
// =============================================================================

export const guards = {
  /** Can skip dialogs and flash directly using existing USB connection */
  canReuseExistingConnection: (
    ctx: DownloadFlowContext,
    _event: DownloadEvent
  ) =>
    ctx.connection !== undefined &&
    ctx.connection.status === DeviceConnectionStatus.CONNECTED &&
    !isNativeBluetoothConnection(ctx.connection) &&
    ctx.connectedBoardVersion !== "V1",

  shouldShowHelp: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.showPreDownloadHelp,

  hasActiveDataConnection: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.hadSuccessfulConnection,

  isUsbConnected: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.isUsbConnected,

  isUsbConnectedV1: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.isUsbConnected && ctx.connectedBoardVersion === "V1",

  isV1BoardVersion: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.connectedBoardVersion === "V1",

  /** True when user chose to download to the same micro:bit as data connection */
  isSameMicrobitChoice: (ctx: DownloadFlowContext, _event: DownloadEvent) =>
    ctx.microbitChoice === SameOrDifferentChoice.Same,

  // Native Bluetooth permission errors (from connectFlash failures).
  isBluetoothDisabledError: (_ctx: DownloadFlowContext, event: DownloadEvent) =>
    event.type === "connectFlashFailure" && event.code === "disabled",

  isPermissionDeniedError: (_ctx: DownloadFlowContext, event: DownloadEvent) =>
    event.type === "connectFlashFailure" && event.code === "permission-denied",

  isLocationDisabledError: (_ctx: DownloadFlowContext, event: DownloadEvent) =>
    event.type === "connectFlashFailure" && event.code === "location-disabled",

  // Native Bluetooth: no device matching the pattern was found during scan
  isNoDeviceSelectedError: (_ctx: DownloadFlowContext, event: DownloadEvent) =>
    event.type === "connectFlashFailure" && event.code === "no-device-selected",
};

// =============================================================================
// Global handlers
// =============================================================================

/**
 * Global handlers shared by all download flows.
 */
export const globalHandlers: DownloadFlowDefinition = {
  _global: {
    on: {
      close: { target: DownloadStep.None },
    },
  },
};

// =============================================================================
// Shared state configurations
// =============================================================================

/**
 * FlashingInProgress state with V1 board version check.
 * Used by webusb and radio flows.
 */
export const flashingInProgressWithV1Check: DownloadFlowDefinition = {
  [DownloadStep.FlashingInProgress]: {
    entry: [{ type: "initializeFlashingProgress" }],
    on: {
      connectFlashSuccess: [
        {
          guard: guards.isV1BoardVersion,
          target: DownloadStep.IncompatibleDevice,
        },
        {
          guard: always,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "flash" }],
        },
      ],
      connectFlashFailure: {
        target: DownloadStep.ManualFlashingTutorial,
        actions: [{ type: "downloadHexFile" }],
      },
      flashSuccess: { target: DownloadStep.None },
      flashFailure: {
        target: DownloadStep.ManualFlashingTutorial,
        actions: [{ type: "downloadHexFile" }],
      },
    },
  },
};

/**
 * ManualFlashingTutorial terminal state.
 */
export const manualFlashingTutorialState: DownloadFlowDefinition = {
  [DownloadStep.ManualFlashingTutorial]: {
    on: {},
  },
};

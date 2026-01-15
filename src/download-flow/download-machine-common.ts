/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ConnectionStatus as DeviceConnectionStatus,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import {
  DataConnectionType,
  dataConnectionTypeToTransport,
} from "../data-connection-flow";
import { isNativeBluetoothConnection } from "../device/connection-utils";
import { DownloadStep, HexData, SameOrDifferentChoice } from "../model";
import { always, FlowDefinition } from "../state-machine";

export type DownloadEvent =
  | { type: "start"; hex: HexData; bluetoothMicrobitName?: string }
  | { type: "next"; skipHelpNextTime?: boolean }
  | { type: "back" }
  | { type: "close" }
  | { type: "choseSame" }
  | { type: "choseDifferent" }
  | { type: "connectSuccess"; boardVersion: "V1" | "V2" }
  | { type: "connectFailure"; code?: string }
  | { type: "flashSuccess" }
  | { type: "flashFailure"; code?: string };

export type DownloadAction =
  | /**
   * Sets hex and bluetoothMicrobitName from start event.
   */
  { type: "initializeDownload" }
  | { type: "setMicrobitChoice"; choice: SameOrDifferentChoice }
  /**
   * Saves showPreDownloadHelp setting from next event.
   */
  | { type: "saveHelpPreference" }
  | { type: "connect" }
  | { type: "flash" }
  | { type: "downloadHexFile" }
  | { type: "disconnectDataConnection" };

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
  connectedBoardVersion?: "V1" | "V2";
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
    !isNativeBluetoothConnection(ctx.connection),

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

  /** True when data connection uses bluetooth (need to disconnect before flashing same microbit) */
  isBluetoothDataConnection: (
    ctx: DownloadFlowContext,
    _event: DownloadEvent
  ) => dataConnectionTypeToTransport(ctx.dataConnectionType) === "bluetooth",

  isUsbConnectedWithBluetooth: (
    ctx: DownloadFlowContext,
    _event: DownloadEvent
  ) =>
    ctx.isUsbConnected &&
    dataConnectionTypeToTransport(ctx.dataConnectionType) === "bluetooth",

  /** For WebUsbFlashingTutorial: disconnect needed when same microbit with bluetooth */
  shouldDisconnectBeforeConnect: (
    ctx: DownloadFlowContext,
    _event: DownloadEvent
  ) =>
    ctx.microbitChoice === SameOrDifferentChoice.Same &&
    dataConnectionTypeToTransport(ctx.dataConnectionType) === "bluetooth",
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
    on: {
      connectSuccess: [
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
      connectFailure: {
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

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "@microbit/microbit-connection";
import { ConnectResult } from "../connection-service";
import {
  DataConnectionStep,
  DataConnectionType,
  RadioFlowPhase,
} from "./data-connection-types";
import {
  always,
  ConditionalTransition,
  FlowDefinition,
} from "../state-machine";

export type DataConnectionEvent =
  | /**
   * User wants to connect - state machine decides fresh vs reconnect.
   */
  { type: "connect" }
  | { type: "next" }
  | { type: "back" }
  | { type: "close" }
  | { type: "tryAgain" }
  | { type: "switchFlowType" }
  /**
   * Skip data collection hex flashing.
   */
  | { type: "skip" }
  /**
   * From MicrobitUnsupported dialog.
   */
  | { type: "startBluetoothFlow" }
  | { type: "setMicrobitName"; name: string }
  | { type: "connectSuccess" }
  | {
      type: "connectFailure";
      reason: ConnectResult;
    }
  | {
      type: "flashSuccess";
      boardVersion?: BoardVersion;
      deviceId?: number;
      bluetoothMicrobitName?: string;
    }
  | { type: "flashFailure"; reason: ConnectResult }
  // Device status events - sent directly from the status listener.
  | { type: "deviceConnected" }
  | { type: "deviceDisconnected"; source?: "bridge" | "remote" }
  | { type: "deviceConnecting" }
  | { type: "deviceReconnecting" }
  | { type: "deviceNoAuthorizedDevice" }
  // User-initiated disconnect event.
  | { type: "disconnect" };

export type DataConnectionAction =
  | { type: "setConnectionType"; connectionType: DataConnectionType }
  /**
   * Sets name from event, clears deviceId.
   */
  | { type: "setMicrobitName" }
  | { type: "setBluetoothName"; name?: string }
  | { type: "setBluetoothDeviceId"; deviceId?: number }
  | { type: "setRadioRemoteDeviceId"; deviceId?: number }
  | { type: "setRadioBridgeDeviceId"; deviceId?: number }
  | { type: "setBoardVersion"; version?: BoardVersion }
  /**
   * Sets flow type and capabilities for fresh connection.
   */
  | { type: "reset" }
  | { type: "connect" }
  | { type: "flash" }
  | { type: "connectBluetooth"; clearDevice: boolean }
  | { type: "connectMicrobits" }
  | { type: "downloadHex" }
  | { type: "notifyConnected" }
  // Reconnect tracking actions.
  | { type: "setHasFailedOnce"; value: boolean }
  | { type: "setIsStartingOver"; value: boolean }
  | { type: "reconnect" }
  // Connection state actions.
  | { type: "setReconnecting"; value: boolean }
  | { type: "setRadioFlowPhase"; phase: RadioFlowPhase }
  /**
   * Sets hadSuccessfulConnection=true, isReconnecting=false.
   */
  | { type: "setConnected" }
  // Listener management actions.
  | { type: "addStatusListener" }
  | { type: "removeStatusListener" }
  // Disconnect action.
  | { type: "disconnect" }
  /**
   * Track disconnect source for error dialogs.
   */
  | { type: "setDisconnectSource" };

export interface DataConnectionContext {
  type: DataConnectionType;
  step: DataConnectionStep;
  isWebBluetoothSupported: boolean;
  isWebUsbSupported: boolean;
  bluetoothMicrobitName?: string;
  radioRemoteDeviceId?: number;
  boardVersion?: BoardVersion;
  /**
   * True if user connected successfully in this session.
   */
  hadSuccessfulConnection: boolean;
  /**
   * True if we've already failed once - next failure shows "start over" dialog.
   */
  hasFailedOnce: boolean;
  /**
   * True when user is restarting the flow from the StartOver state.
   */
  isStartingOver: boolean;
  /**
   * Browser tab visibility - used to defer error states while user is away.
   */
  isBrowserTabVisible: boolean;
  /**
   * Tracks disconnect source for error dialogs.
   */
  lastDisconnectSource?: "bridge" | "remote";
  /**
   * Tracks the current phase within the radio connection flow.
   */
  radioFlowPhase?: RadioFlowPhase;
}

export type DataConnectionFlowDef = FlowDefinition<
  DataConnectionStep,
  DataConnectionEvent,
  DataConnectionAction,
  DataConnectionContext
>;

export type DataConnectionTransition = ConditionalTransition<
  DataConnectionStep,
  DataConnectionAction,
  DataConnectionContext,
  DataConnectionEvent
>;

export const guards = {
  isWebBluetoothSupported: (ctx: DataConnectionContext) =>
    ctx.isWebBluetoothSupported,

  isWebUsbSupported: (ctx: DataConnectionContext) => ctx.isWebUsbSupported,

  // User has connected successfully in this session - can attempt direct reconnection
  hadSuccessfulConnection: (ctx: DataConnectionContext) =>
    ctx.hadSuccessfulConnection,

  // Already failed once - next failure shows "start over" dialog
  hasFailedOnce: (ctx: DataConnectionContext) => ctx.hasFailedOnce,

  // User is restarting the flow from StartOver - back should return there
  isStartingOver: (ctx: DataConnectionContext) => ctx.isStartingOver,

  isV1Board: (ctx: DataConnectionContext) => ctx.boardVersion === "V1",

  // Radio flow phase guards
  isInBridgePhase: (ctx: DataConnectionContext) =>
    ctx.radioFlowPhase === "bridge",

  // Browser supports neither WebBluetooth nor WebUSB
  hasNoSupportedConnectionMethod: (ctx: DataConnectionContext) =>
    !ctx.isWebBluetoothSupported && !ctx.isWebUsbSupported,

  // Browser tab visibility guard
  isTabHidden: (ctx: DataConnectionContext) => !ctx.isBrowserTabVisible,

  // Guards that check event payload
  isBadFirmwareError: (
    _ctx: DataConnectionContext,
    event: DataConnectionEvent
  ) =>
    event.type === "connectFailure" &&
    event.reason === ConnectResult.ErrorBadFirmware,

  isNoDeviceSelectedError: (
    _ctx: DataConnectionContext,
    event: DataConnectionEvent
  ) =>
    (event.type === "connectFailure" || event.type === "flashFailure") &&
    (event as { reason?: ConnectResult }).reason ===
      ConnectResult.ErrorNoDeviceSelected,

  isUnableToClaimError: (
    _ctx: DataConnectionContext,
    event: DataConnectionEvent
  ) =>
    (event.type === "connectFailure" || event.type === "flashFailure") &&
    (event as { reason?: ConnectResult }).reason ===
      ConnectResult.ErrorUnableToClaimInterface,
};

// =============================================================================
// Shared state configurations
// =============================================================================

// Reusable action arrays for common patterns
export const actions = {
  // Set reconnecting flag
  reconnecting: [{ type: "setReconnecting", value: true }],

  // Reconnect with flag update
  reconnectWithFlag: [
    { type: "setReconnecting", value: true },
    { type: "reconnect" },
  ],

  // First auto-reconnect attempt
  firstReconnectAttempt: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: true },
    { type: "reconnect" },
  ],

  // Successfully reconnected/connected
  connected: [
    { type: "setHasFailedOnce", value: false },
    { type: "setConnected" },
  ],

  // Connection lost after retry - preserve hasFailedOnce so user-initiated
  // reconnect failure goes to StartOver
  connectionLost: [{ type: "setReconnecting", value: false }],

  // Initial connect success (first time connecting)
  initialConnectSuccess: [
    { type: "notifyConnected" },
    { type: "setHasFailedOnce", value: false },
    { type: "setConnected" },
  ],

  // First connection attempt failed
  firstConnectFailure: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: false },
  ],

  // Failed twice - show start over dialog, reset state for fresh start
  failedTwice: [
    { type: "setReconnecting", value: false },
    { type: "reset" },
    { type: "setIsStartingOver", value: true },
  ],

  // Reset flow state
  reset: [{ type: "reset" }],

  // Flow type switching
  // setConnectionType sets hasSwitchedConnectionType and updates the status listener
  switchToRadio: [
    {
      type: "setConnectionType",
      connectionType: DataConnectionType.Radio,
    },
  ],
  switchToWebBluetooth: [
    {
      type: "setConnectionType",
      connectionType: DataConnectionType.WebBluetooth,
    },
  ],

  // Radio flow phase actions
  setRemotePhase: [{ type: "setRadioFlowPhase", phase: "remote" }],
  setBridgePhase: [{ type: "setRadioFlowPhase", phase: "bridge" }],

  // Track disconnect source for error dialogs
  setDisconnectSource: [{ type: "setDisconnectSource" }],
} satisfies Record<string, DataConnectionAction[]>;

// =============================================================================
// Shared Idle state transitions
// =============================================================================

/**
 * Browser unsupported transition - used by WebBluetooth and Radio flows.
 */
export const idleBrowserUnsupported = {
  guard: guards.hasNoSupportedConnectionMethod,
  target: DataConnectionStep.WebUsbBluetoothUnsupported,
};

/**
 * Bluetooth reconnect transition - used by WebBluetooth and NativeBluetooth flows.
 */
export const idleBluetoothReconnect = {
  guard: guards.hadSuccessfulConnection,
  target: DataConnectionStep.BluetoothConnect,
  actions: [
    { type: "addStatusListener" },
    { type: "setHasFailedOnce", value: false },
    { type: "setIsStartingOver", value: false },
    { type: "setReconnecting", value: true },
    { type: "connectBluetooth", clearDevice: false },
  ],
} satisfies DataConnectionTransition;

/**
 * Fresh start transition - used by WebBluetooth and NativeBluetooth flows.
 */
export const idleFreshStart = {
  guard: always,
  target: DataConnectionStep.Start,
  actions: [{ type: "addStatusListener" }, ...actions.reset],
} satisfies DataConnectionTransition;

/**
 * Create device event handlers for the Connected state.
 * Handles reconnection logic with tab visibility awareness.
 */
export const createConnectedHandlers = () => ({
  deviceDisconnected: [
    // Tab hidden: silently keep trying to reconnect
    {
      guard: guards.isTabHidden,
      target: DataConnectionStep.Connected,
      actions: [...actions.setDisconnectSource, ...actions.reconnectWithFlag],
    },
    // Tab visible, first disconnect: try auto-reconnect
    {
      guard: (ctx: DataConnectionContext) => !ctx.hasFailedOnce,
      target: DataConnectionStep.Connected,
      actions: [
        ...actions.setDisconnectSource,
        ...actions.firstReconnectAttempt,
      ],
    },
    // Tab visible, second disconnect: show connection lost
    {
      guard: always,
      target: DataConnectionStep.ConnectionLost,
      actions: [...actions.setDisconnectSource, ...actions.connectionLost],
    },
  ],
  deviceReconnecting: {
    target: DataConnectionStep.Connected,
    actions: actions.reconnecting,
  },
  deviceConnected: {
    target: DataConnectionStep.Connected,
    actions: actions.connected,
  },
});

/**
 * Create device event handlers for initial connection (BluetoothConnect, ConnectingMicrobits).
 */
export const createInitialConnectHandlers = () => ({
  deviceConnected: {
    target: DataConnectionStep.Connected,
    actions: actions.initialConnectSuccess,
  },
  deviceDisconnected: [
    // First attempt failed - show retry dialog
    {
      guard: (ctx: DataConnectionContext) => !ctx.hasFailedOnce,
      target: DataConnectionStep.ConnectFailed,
      actions: [...actions.setDisconnectSource, ...actions.firstConnectFailure],
    },
    // Retry attempt failed - show start over dialog
    {
      guard: always,
      target: DataConnectionStep.StartOver,
      actions: [...actions.setDisconnectSource, ...actions.failedTwice],
    },
  ],
});

/**
 * Create recovery error states (ConnectFailed, ConnectionLost).
 * These states allow the user to retry reconnection.
 */
export const createRecoveryStates = (
  reconnectTarget: DataConnectionStep,
  reconnectAction: DataConnectionAction
) => {
  const reconnectActions: DataConnectionAction[] = [
    { type: "setReconnecting", value: true },
    reconnectAction,
  ];

  return {
    [DataConnectionStep.ConnectFailed]: {
      on: {
        connect: { target: reconnectTarget, actions: reconnectActions },
        next: { target: reconnectTarget, actions: reconnectActions },
      },
    },
    [DataConnectionStep.ConnectionLost]: {
      on: {
        connect: { target: reconnectTarget, actions: reconnectActions },
        next: { target: reconnectTarget, actions: reconnectActions },
      },
    },
  };
};

/**
 * Create a try-again error state that returns to the specified target.
 */
export const createTryAgainState = (
  step: DataConnectionStep,
  tryAgainTarget: DataConnectionStep
) => ({
  [step]: {
    on: {
      tryAgain: { target: tryAgainTarget },
    },
  },
});

/**
 * Create BadFirmware error state that returns to ConnectCable.
 */
export const badFirmwareState = createTryAgainState(
  DataConnectionStep.BadFirmware,
  DataConnectionStep.ConnectCable
);

/**
 * WebUSB try-again error states (replug, close tabs, select microbit).
 */
export const webUsbTryAgainStates = {
  ...createTryAgainState(
    DataConnectionStep.TryAgainReplugMicrobit,
    DataConnectionStep.ConnectCable
  ),
  ...createTryAgainState(
    DataConnectionStep.TryAgainCloseTabs,
    DataConnectionStep.ConnectCable
  ),
  ...createTryAgainState(
    DataConnectionStep.TryAgainWebUsbSelectMicrobit,
    DataConnectionStep.ConnectCable
  ),
};

/**
 * switchFlowType handler for bluetooth flow (switches to radio).
 * Always goes to Start to show the new flow's requirements.
 */
export const switchToRadio = {
  switchFlowType: {
    target: DataConnectionStep.Start,
    actions: actions.switchToRadio,
  },
};

/**
 * switchFlowType handler for radio flow (switches to webBluetooth if supported).
 * Always goes to Start to show the new flow's requirements.
 */
export const switchToWebBluetooth = {
  switchFlowType: [
    {
      guard: guards.isWebBluetoothSupported,
      target: DataConnectionStep.Start,
      actions: actions.switchToWebBluetooth,
    },
  ],
};

/**
 * WebUsbFlashingTutorial state shared by WebBluetooth and Radio flows.
 */
export const webUsbFlashingTutorialState: DataConnectionFlowDef = {
  [DataConnectionStep.WebUsbFlashingTutorial]: {
    on: {
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "connect" }],
      },
      back: { target: DataConnectionStep.ConnectCable },
    },
  },
};

/**
 * WebUsbBluetoothUnsupported terminal state shared by WebBluetooth and Radio flows.
 */
export const webUsbBluetoothUnsupportedState: DataConnectionFlowDef = {
  [DataConnectionStep.WebUsbBluetoothUnsupported]: {
    on: {},
  },
};

/**
 * Connected state shared by WebBluetooth and NativeBluetooth flows.
 * Radio flow needs additional setRemotePhase action.
 */
export const connectedState = {
  [DataConnectionStep.Connected]: {
    on: {
      connect: {
        target: DataConnectionStep.Start,
        actions: actions.reset,
      },
      ...createConnectedHandlers(),
    },
  },
};

/**
 * Global handlers shared by all flows.
 * The close event always returns to Idle state.
 * Disconnect event returns to Idle and removes status listener.
 */
export const globalHandlers = {
  _global: {
    on: {
      close: {
        target: DataConnectionStep.Idle,
        actions: actions.reset,
      },
      disconnect: {
        target: DataConnectionStep.Idle,
        actions: [{ type: "removeStatusListener" }, { type: "disconnect" }],
      },
    },
  },
} satisfies DataConnectionFlowDef;

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "@microbit/microbit-connection";
import {
  DataConnectionState,
  DataConnectionStep,
  DataConnectionType,
  RadioFlowPhase,
} from "./data-connection-types";
import {
  always,
  ConditionalTransition,
  FlowDefinition,
} from "../state-machine";
import { isNativePlatform } from "../platform";

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
      /** DeviceError code if the failure was due to a DeviceError. */
      code?: string;
    }
  | {
      type: "flashSuccess";
      boardVersion?: BoardVersion;
      deviceId?: number;
      bluetoothMicrobitName?: string;
    }
  | {
      type: "flashFailure";
      /** DeviceError code if the failure was due to a DeviceError. */
      code?: string;
    }
  // Device status events - sent directly from the status listener.
  | { type: "deviceConnected" }
  | { type: "deviceDisconnected"; source?: "bridge" | "remote" }
  | { type: "deviceConnecting" }
  | { type: "deviceReconnecting" }
  /**
   * Connection paused due to tab visibility. Will reconnect when tab visible.
   */
  | { type: "devicePaused" }
  // User-initiated disconnect event.
  | { type: "disconnect" }
  // Reset state (use after disconnect when micro:bit is being reused).
  | { type: "reset" };

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

export type DataConnectionFlowDef = FlowDefinition<
  DataConnectionStep,
  DataConnectionEvent,
  DataConnectionAction,
  DataConnectionState
>;

export type DataConnectionTransition = ConditionalTransition<
  DataConnectionStep,
  DataConnectionAction,
  DataConnectionState,
  DataConnectionEvent
>;

export const guards = {
  // User has connected successfully in this session - can attempt direct reconnection
  hadSuccessfulConnection: (ctx: DataConnectionState) =>
    ctx.hadSuccessfulConnection,

  // Already failed once - next failure shows "start over" dialog
  hasFailedOnce: (ctx: DataConnectionState) => ctx.hasFailedOnce,

  // User is restarting the flow from StartOver - back should return there
  isStartingOver: (ctx: DataConnectionState) => ctx.isStartingOver,

  isV1Board: (ctx: DataConnectionState) => ctx.radioRemoteBoardVersion === "V1",

  // Radio flow phase guards
  // Remote phase is the default - undefined is treated as remote
  isInRemotePhase: (ctx: DataConnectionState) =>
    ctx.radioFlowPhase === "remote" || ctx.radioFlowPhase === undefined,
  isInBridgePhase: (ctx: DataConnectionState) =>
    ctx.radioFlowPhase === "bridge",

  // ==========================================================================
  // Flow support guards - which connection flows are available
  // ==========================================================================

  /** WebBluetooth flow requires browser WebBluetooth API support. */
  isWebBluetoothFlowSupported: (ctx: DataConnectionState) =>
    ctx.isWebBluetoothSupported,

  /** Radio flow requires WebUSB for flashing the micro:bits. */
  isRadioFlowSupported: (ctx: DataConnectionState) => ctx.isWebUsbSupported,

  /** Native Bluetooth flow is available on iOS/Android apps. */
  isNativeBluetoothFlowSupported: () => isNativePlatform(),

  /** No connection flow is available - show unsupported browser message. */
  hasNoSupportedFlow: (ctx: DataConnectionState) =>
    !ctx.isWebBluetoothSupported &&
    !ctx.isWebUsbSupported &&
    !isNativePlatform(),

  // ==========================================================================

  // Browser tab visibility guard
  isTabHidden: (ctx: DataConnectionState) => !ctx.isBrowserTabVisible,

  // Guards that check event payload (using DeviceError codes directly)
  isBadFirmwareError: (_ctx: DataConnectionState, event: DataConnectionEvent) =>
    event.type === "connectFailure" && event.code === "update-req",

  isNoDeviceSelectedError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) => {
    if (event.type === "connectFailure" || event.type === "flashFailure") {
      return event.code === "no-device-selected";
    }
    return false;
  },

  isUnableToClaimError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) => {
    if (event.type === "connectFailure" || event.type === "flashFailure") {
      return event.code === "clear-connect";
    }
    return false;
  },
};

// =============================================================================
// Shared state configurations
// =============================================================================

// Reusable action arrays for common patterns

// Successfully reconnected/connected - defined first so it can be reused
const connectedActions: DataConnectionAction[] = [
  { type: "setHasFailedOnce", value: false },
  { type: "setConnected" },
];

export const actions = {
  // Set reconnecting flag
  reconnecting: [{ type: "setReconnecting", value: true }],

  // First auto-reconnect attempt
  firstReconnectAttempt: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: true },
    { type: "reconnect" },
  ],

  // Successfully reconnected/connected
  connected: connectedActions,

  // Connection lost after retry - preserve hasFailedOnce so user-initiated
  // reconnect failure goes to StartOver
  connectionLost: [{ type: "setReconnecting", value: false }],

  // Initial connect success (first time connecting)
  initialConnectSuccess: [{ type: "notifyConnected" }, ...connectedActions],

  // First connection attempt failed
  firstConnectFailure: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: false },
  ],

  // Failed twice - show start over dialog, reset state for fresh start
  // Note: reset sets isStartingOver=false, then we override to true
  failedTwice: [{ type: "reset" }, { type: "setIsStartingOver", value: true }],

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
  guard: guards.hasNoSupportedFlow,
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
 */
export const createConnectedHandlers = () => ({
  // Connection paused due to tab visibility - stay connected, library will move
  // out of paused when tab is visible. Only used for USB connections.
  devicePaused: {
    target: DataConnectionStep.Connected,
    actions: actions.reconnecting,
  },
  deviceDisconnected: [
    // First disconnect: try auto-reconnect
    {
      guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
      target: DataConnectionStep.Connected,
      actions: [
        ...actions.setDisconnectSource,
        ...actions.firstReconnectAttempt,
      ],
    },
    // Second disconnect: show connection lost
    {
      guard: always,
      target: DataConnectionStep.ConnectionLost,
      actions: [...actions.setDisconnectSource, ...actions.connectionLost],
    },
  ],
  // Reconnection failed (e.g., user cancelled device picker). Treat like disconnect.
  connectFailure: [
    {
      guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
      target: DataConnectionStep.Connected,
      actions: actions.firstReconnectAttempt,
    },
    {
      guard: always,
      target: DataConnectionStep.ConnectionLost,
      actions: actions.connectionLost,
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
 * @param options.connectFailureGuards - Additional guards checked before standard failure handling
 */
export const createInitialConnectHandlers = (options?: {
  connectFailureGuards?: DataConnectionTransition[];
}) => ({
  deviceConnected: {
    target: DataConnectionStep.Connected,
    actions: actions.initialConnectSuccess,
  },
  deviceDisconnected: [
    // First attempt failed - show retry dialog
    {
      guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
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
  // Connection action failed (e.g., user cancelled device picker)
  connectFailure: [
    ...(options?.connectFailureGuards ?? []),
    {
      guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
      target: DataConnectionStep.ConnectFailed,
      actions: actions.firstConnectFailure,
    },
    {
      guard: always,
      target: DataConnectionStep.StartOver,
      actions: actions.failedTwice,
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
      guard: guards.isWebBluetoothFlowSupported,
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
 * - close: returns to Idle and resets state
 * - disconnect: returns to Idle (preserves hadSuccessfulConnection for reconnect)
 * - reset: resets state in place (use after disconnect when micro:bit is being reused)
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
      reset: {
        target: DataConnectionStep.Idle,
        actions: actions.reset,
      },
    },
  },
} satisfies DataConnectionFlowDef;

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

// =============================================================================
// Types
// =============================================================================

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
  | { type: "connectFlashSuccess"; boardVersion?: BoardVersion }
  | {
      type: "connectFlashFailure";
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
  // Data connection failure event - sent from performConnectData.
  // Success is handled via the status listener (deviceConnected).
  | { type: "connectDataFailure"; code?: string }
  // Device status events - sent from the status listener.
  | { type: "deviceConnected" }
  | { type: "deviceDisconnected"; source?: "bridge" | "remote" }
  | { type: "deviceReconnecting" }
  /**
   * Connection paused due to tab visibility. Will reconnect when tab visible.
   */
  | { type: "devicePaused" }
  // User-initiated disconnect event.
  | { type: "disconnect" }
  // Reset state (use after disconnect when micro:bit is being reused).
  | { type: "reset" }
  // Permission check result events (native Bluetooth only).
  | { type: "permissionsOk" }
  | { type: "bluetoothDisabled" }
  | { type: "permissionDenied" }
  | { type: "locationDisabled" }
  // Switch between pairing method variants (triple-reset vs a-b-reset).
  | { type: "switchPairingMethod" };

export type DataConnectionAction =
  | { type: "setConnectionType"; connectionType: DataConnectionType }
  /**
   * Sets micro:bit name from setMicrobitName event (user input) or flashSuccess event (from flashing).
   */
  | { type: "setMicrobitName" }
  | { type: "setRadioRemoteDeviceId"; deviceId?: number }
  | { type: "setRadioBridgeDeviceId"; deviceId?: number }
  /**
   * Sets flow type and capabilities for fresh connection.
   */
  | { type: "reset" }
  | { type: "connectFlash" }
  | { type: "flash" }
  /**
   * Connect to the data connection (bluetooth or radio bridge).
   * If clearDevice is true, clears any existing device first.
   */
  | { type: "connectData"; clearDevice?: boolean }
  | { type: "downloadHexFile" }
  | { type: "notifyConnected" }
  // Reconnect tracking actions.
  | { type: "setHasFailedOnce"; value: boolean }
  | { type: "setIsStartingOver"; value: boolean }
  // Connection state actions.
  | { type: "setReconnecting"; value: boolean }
  | { type: "setRadioFlowPhase"; phase: RadioFlowPhase }
  /**
   * Sets hadSuccessfulConnection=true, isReconnecting=false.
   */
  | { type: "setConnected" }
  // Disconnect action.
  | { type: "disconnectData" }
  /**
   * Track disconnect source for error dialogs.
   */
  | { type: "setDisconnectSource" }
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
   * Toggle between pairing method variants (triple-reset ↔ a-b-reset).
   */
  | { type: "togglePairingMethod" };

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

// =============================================================================
// Guards
// =============================================================================

export const guards = {
  /**
   * User has connected successfully in this session - can attempt direct reconnection.
   */
  hadSuccessfulConnection: (ctx: DataConnectionState) =>
    ctx.hadSuccessfulConnection,

  /**
   * Already failed once - next failure shows "start over" dialog.
   */
  hasFailedOnce: (ctx: DataConnectionState) => ctx.hasFailedOnce,

  /**
   * User is restarting the flow from StartOver - back should return there.
   */
  isStartingOver: (ctx: DataConnectionState) => ctx.isStartingOver,

  isV1Board: (_ctx: DataConnectionState, event: DataConnectionEvent) =>
    event.type === "connectFlashSuccess" && event.boardVersion === "V1",

  /**
   * Radio bridge disconnected (USB unplugged) - can't auto-reconnect.
   */
  isBridgeDisconnect: (_ctx: DataConnectionState, event: DataConnectionEvent) =>
    event.type === "deviceDisconnected" && event.source === "bridge",

  // Radio flow phase guards

  /**
   * Remote phase is the default - undefined is treated as remote.
   */
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

  /**
   * Browser tab visibility guard.
   */
  isTabHidden: (ctx: DataConnectionState) => !ctx.isBrowserTabVisible,

  // Guards that check event payload (using DeviceError codes directly)
  // Flash connection errors (from performConnectFlash)
  isBadFirmwareError: (_ctx: DataConnectionState, event: DataConnectionEvent) =>
    event.type === "connectFlashFailure" && event.code === "update-req",

  // Native Bluetooth permission errors - can occur in both flash and data connection contexts.
  // In native Bluetooth, both connectFlash and connectData use Bluetooth, so permission errors
  // can come from either connectFlashFailure (flash) or connectDataFailure (data).
  isBluetoothDisabledError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) =>
    (event.type === "connectFlashFailure" ||
      event.type === "connectDataFailure") &&
    event.code === "disabled",

  isPermissionDeniedError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) =>
    (event.type === "connectFlashFailure" ||
      event.type === "connectDataFailure") &&
    event.code === "permission-denied",

  isLocationDisabledError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) =>
    (event.type === "connectFlashFailure" ||
      event.type === "connectDataFailure") &&
    event.code === "location-disabled",

  // Errors that can occur in flash or data connection contexts
  isNoDeviceSelectedError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) => {
    if (
      event.type === "connectFlashFailure" ||
      event.type === "connectDataFailure" ||
      event.type === "flashFailure"
    ) {
      return event.code === "no-device-selected";
    }
    return false;
  },

  isUnableToClaimError: (
    _ctx: DataConnectionState,
    event: DataConnectionEvent
  ) => {
    if (
      event.type === "connectFlashFailure" ||
      event.type === "connectDataFailure" ||
      event.type === "flashFailure"
    ) {
      return event.code === "clear-connect";
    }
    return false;
  },
};

// =============================================================================
// Reusable action arrays
// =============================================================================

// Successfully reconnected/connected - defined first so it can be reused
const connectedActions: DataConnectionAction[] = [
  { type: "setHasFailedOnce", value: false },
  { type: "setConnected" },
];

export const actions = {
  /**
   * Set reconnecting flag.
   */
  reconnecting: [{ type: "setReconnecting", value: true }],

  /**
   * First auto-reconnect attempt.
   */
  firstReconnectAttempt: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: true },
    { type: "connectData" },
  ],

  /**
   * Successfully reconnected/connected.
   */
  connected: connectedActions,

  /**
   * Connection lost after retry - preserve hasFailedOnce so user-initiated
   * reconnect failure goes to StartOver.
   */
  connectionLost: [{ type: "setReconnecting", value: false }],

  /**
   * Initial connect success (first time connecting).
   */
  initialConnectSuccess: [{ type: "notifyConnected" }, ...connectedActions],

  /**
   * First connection attempt failed.
   */
  firstConnectFailure: [
    { type: "setHasFailedOnce", value: true },
    { type: "setReconnecting", value: false },
  ],

  /**
   * Reset flow state.
   */
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

  /**
   * Track disconnect source for error dialogs.
   */
  setDisconnectSource: [{ type: "setDisconnectSource" }],
} satisfies Record<string, DataConnectionAction[]>;

// =============================================================================
// Shared transition helpers
// =============================================================================

// -----------------------------------------------------------------------------
// Idle state transitions
// -----------------------------------------------------------------------------

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
    { type: "setHasFailedOnce", value: false },
    { type: "setIsStartingOver", value: false },
    { type: "setReconnecting", value: true },
    { type: "connectData" },
  ],
} satisfies DataConnectionTransition;

/**
 * Radio reconnect transition - used by Radio flow.
 */
export const idleRadioReconnect = {
  guard: guards.hadSuccessfulConnection,
  target: DataConnectionStep.ConnectingMicrobits,
  actions: [
    { type: "setHasFailedOnce", value: false },
    { type: "setIsStartingOver", value: false },
    { type: "setReconnecting", value: true },
    { type: "connectData" },
  ],
} satisfies DataConnectionTransition;

/**
 * Fresh start transition - used by all flows.
 */
export const idleFreshStart = {
  guard: always,
  target: DataConnectionStep.Start,
  actions: actions.reset,
} satisfies DataConnectionTransition;

// -----------------------------------------------------------------------------
// Back navigation
// -----------------------------------------------------------------------------

/**
 * Back navigation to Start or StartOver depending on isStartingOver flag.
 * Used by WebBluetooth and NativeBluetooth flows.
 */
export const backToStartTransition: DataConnectionTransition[] = [
  {
    guard: guards.isStartingOver,
    target: DataConnectionStep.StartOver,
  },
  {
    guard: always,
    target: DataConnectionStep.Start,
  },
];

// -----------------------------------------------------------------------------
// Flow type switching
// -----------------------------------------------------------------------------

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

// =============================================================================
// Factory functions
// =============================================================================

/**
 * Create event handlers for initial connection (BluetoothConnect, ConnectingMicrobits).
 * @param options.connectFlashFailureGuards - Additional guards checked before standard failure handling
 */
export const createInitialConnectHandlers = (options?: {
  connectFlashFailureGuards?: DataConnectionTransition[];
}) => ({
  // Success comes via status listener, not explicit event from performConnectData,
  // because the connection library has internal auto-reconnect logic.
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
      actions: [...actions.setDisconnectSource, ...actions.reset],
    },
  ],
  /**
   * Connection action failed (e.g., user cancelled device picker).
   */
  connectDataFailure: [
    ...(options?.connectFlashFailureGuards ?? []),
    {
      guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
      target: DataConnectionStep.ConnectFailed,
      actions: actions.firstConnectFailure,
    },
    {
      guard: always,
      target: DataConnectionStep.StartOver,
      actions: actions.reset,
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
        next: { target: reconnectTarget, actions: reconnectActions },
      },
    },
    [DataConnectionStep.ConnectionLost]: {
      on: {
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
 * Recovery states for bluetooth flows (WebBluetooth and NativeBluetooth).
 */
export const bluetoothRecoveryStates = createRecoveryStates(
  DataConnectionStep.BluetoothConnect,
  { type: "connectData" }
);

// =============================================================================
// Shared event handlers
// =============================================================================

/**
 * Handler for setMicrobitName event - stores the micro:bit name from user input.
 * Used by WebBluetooth and NativeBluetooth flows in BluetoothPattern step.
 */
export const setMicrobitNameHandler = {
  setMicrobitName: {
    actions: [{ type: "setMicrobitName" }] as DataConnectionAction[],
  },
};

/**
 * Handler for connectFlashSuccess that triggers flash.
 * Used by WebBluetooth and NativeBluetooth flows in FlashingInProgress step.
 */
export const connectFlashSuccessHandler = {
  connectFlashSuccess: {
    actions: [{ type: "flash" }] as DataConnectionAction[],
  },
};

// =============================================================================
// Shared states
// =============================================================================

/**
 * BadFirmware error state - returns to ConnectCable.
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
 * WebUsbFlashingTutorial state shared by WebBluetooth and Radio flows.
 */
export const webUsbFlashingTutorialState: DataConnectionFlowDef = {
  [DataConnectionStep.WebUsbFlashingTutorial]: {
    on: {
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "connectFlash" }],
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
 * Connected state shared by all flows.
 */
export const connectedState = {
  [DataConnectionStep.Connected]: {
    on: {
      /**
       * Connection paused due to tab visibility - stay connected, library will move
       * out of paused when tab is visible. Only used for USB connections.
       * Internal transition - no exit/entry.
       */
      devicePaused: {
        actions: actions.reconnecting,
      },
      deviceDisconnected: [
        // Bridge disconnect (USB unplugged): can't auto-reconnect
        {
          guard: guards.isBridgeDisconnect,
          target: DataConnectionStep.ConnectionLost,
          actions: [...actions.setDisconnectSource, ...actions.connectionLost],
        },
        // First disconnect: try auto-reconnect
        {
          guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
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
      /**
       * Reconnection failed (e.g., user cancelled device picker). Treat like disconnect.
       */
      connectDataFailure: [
        // First failure: try again
        {
          guard: (ctx: DataConnectionState) => !ctx.hasFailedOnce,
          actions: actions.firstReconnectAttempt,
        },
        {
          guard: always,
          target: DataConnectionStep.ConnectionLost,
          actions: actions.connectionLost,
        },
      ],
      deviceReconnecting: {
        actions: actions.reconnecting,
      },
      // Success comes via status listener, not explicit event from performConnectData,
      // because the connection library has internal auto-reconnect logic.
      deviceConnected: {
        actions: actions.connected,
      },
    },
  },
};

// =============================================================================
// Global handlers
// =============================================================================

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
        actions: [{ type: "disconnectData" }],
      },
      reset: {
        target: DataConnectionStep.Idle,
        actions: actions.reset,
      },
    },
  },
} satisfies DataConnectionFlowDef;

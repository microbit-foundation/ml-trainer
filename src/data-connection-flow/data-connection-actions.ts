/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DeviceError,
  FlashOptions,
  ProgressStage,
} from "@microbit/microbit-connection";
import { deviceIdToMicrobitName } from "../bt-pattern-utils";
import { Connections } from "../connections-hooks";
import {
  DataConnectionAction,
  DataConnectionEvent,
  dataConnectionTransition,
} from "./data-connection-machine";
import {
  DataConnectionType,
  DataConnectionState,
  getInitialDataConnectionType,
} from "./data-connection-types";
import { Logging } from "../logging/logging";
import {
  isWebUSBConnection,
  isWebBluetoothSupported,
  isWebUsbSupported,
} from "../device/connection-utils";
import {
  bluetoothUniversalHex,
  getFlashDataSource,
  HexType,
} from "../device/get-hex-file";
import { useStore } from "../store";
import { downloadHex } from "../utils/fs-util";
import { checkPermissions } from "../shared-steps";

/**
 * Dependencies needed for state machine action execution.
 */
export interface DataConnectionDeps {
  connections: Connections;
  dataCollectionMicrobitConnected: () => void;
  logging: Logging;
}

// =============================================================================
// State management helpers
// =============================================================================

const getDataConnectionState = () => useStore.getState().dataConnection;

const setDataConnectionState = (state: DataConnectionState) => {
  useStore.getState().setDataConnection(state);
};

/**
 * Progress callback that updates the store directly.
 */
const progressCallback = (stage: ProgressStage, value: number | undefined) => {
  useStore.getState().setDataConnectionFlashingProgress(stage, value);
};

// =============================================================================
// State machine event handling
// =============================================================================

/**
 * Send an event to the state machine and execute resulting actions.
 */
const sendEvent = async (
  event: DataConnectionEvent,
  deps: DataConnectionDeps
): Promise<void> => {
  const result = dataConnectionTransition(getDataConnectionState(), event);

  if (!result) {
    return;
  }

  // Update step first
  setDataConnectionState({ ...getDataConnectionState(), step: result.step });

  // Execute actions sequentially, getting fresh state for each
  for (const action of result.actions) {
    await executeAction(action, event, deps);
  }
};

/**
 * Create a function that fires events into the state machine.
 * The returned function captures deps in closure, so callers don't need to pass them.
 */
export const createFireDataConnectionEvent = (
  deps: DataConnectionDeps
): ((event: DataConnectionEvent) => void) => {
  return (event: DataConnectionEvent) => {
    sendEvent(event, deps).catch((error) => {
      deps.logging.error(`Connection flow error [${event.type}]`, error);
    });
  };
};

/**
 * Create an async function that sends events to the state machine and waits for completion.
 * Use this when you need to await the event processing (e.g., disconnecting before connecting).
 */
export const createSendDataConnectionEvent = (
  deps: DataConnectionDeps
): ((event: DataConnectionEvent) => Promise<void>) => {
  return (event: DataConnectionEvent) => sendEvent(event, deps);
};

/**
 * Check if a transition exists for the given event from the current state.
 * Used by UI to conditionally show controls based on state machine capabilities.
 */
export const canTransition = (
  event: DataConnectionEvent,
  state: DataConnectionState
): boolean => {
  return dataConnectionTransition(state, event) !== null;
};

// =============================================================================
// State machine action execution
// =============================================================================

/**
 * Execute a single action from the state machine.
 */
const executeAction = async (
  action: DataConnectionAction,
  event: DataConnectionEvent,
  deps: DataConnectionDeps
): Promise<void> => {
  switch (action.type) {
    case "reset": {
      // Reset flow state and set connection type for fresh connection
      const currentState = getDataConnectionState();
      const connectionType = currentState.hasSwitchedConnectionType
        ? currentState.type
        : getInitialDataConnectionType(currentState.isWebBluetoothSupported);
      setDataConnectionState({
        ...currentState,
        type: connectionType,
        isReconnecting: false,
        hasFailedOnce: false,
        isStartingOver: false,
        hadSuccessfulConnection: false,
      });
      break;
    }

    case "setConnectionType": {
      deps.connections.setDataConnectionType(action.connectionType);
      setDataConnectionState({
        ...getDataConnectionState(),
        hasSwitchedConnectionType: true,
      });
      break;
    }

    case "setMicrobitName": {
      // Extract name from either setMicrobitName event (user input) or flashSuccess event (from USB flashing)
      const name =
        event.type === "setMicrobitName"
          ? event.name
          : event.type === "flashSuccess"
          ? event.bluetoothMicrobitName
          : undefined;
      if (name) {
        deps.connections.bluetooth.setNameFilter(name);
        useStore.getState().setSettings({ bluetoothMicrobitName: name });
      }
      break;
    }

    case "setRadioRemoteDeviceId":
      if (event.type === "flashSuccess" && event.deviceId !== undefined) {
        deps.connections.radioBridge.setRemoteDeviceId(event.deviceId);
        setDataConnectionState({
          ...getDataConnectionState(),
          radioRemoteDeviceId: event.deviceId,
        });
      }
      break;

    case "setRadioBridgeDeviceId":
      if (event.type === "flashSuccess" && event.deviceId !== undefined) {
        setDataConnectionState({
          ...getDataConnectionState(),
          radioBridgeDeviceId: event.deviceId,
        });
      }
      break;

    case "connectFlash":
      await performConnectFlash(deps);
      break;

    case "flash":
      await performFlash(deps);
      break;

    case "connectData":
      await performConnectData(action.clearDevice ?? false, deps);
      break;

    case "downloadHexFile":
      downloadHex(bluetoothUniversalHex);
      break;

    case "notifyConnected":
      deps.dataCollectionMicrobitConnected();
      break;

    // Reconnect tracking actions
    case "setHasFailedOnce":
      setDataConnectionState({
        ...getDataConnectionState(),
        hasFailedOnce: action.value,
      });
      break;

    case "setIsStartingOver":
      setDataConnectionState({
        ...getDataConnectionState(),
        isStartingOver: action.value,
      });
      break;

    // Connection state actions
    case "setReconnecting":
      setDataConnectionState({
        ...getDataConnectionState(),
        isReconnecting: action.value,
      });
      break;

    case "setRadioFlowPhase":
      setDataConnectionState({
        ...getDataConnectionState(),
        radioFlowPhase: action.phase,
      });
      break;

    case "setConnected":
      setDataConnectionState({
        ...getDataConnectionState(),
        hadSuccessfulConnection: true,
        isReconnecting: false,
      });
      break;

    case "disconnectData":
      await performDisconnectData(deps);
      break;

    case "setDisconnectSource":
      if (event.type === "deviceDisconnected" && event.source) {
        setDataConnectionState({
          ...getDataConnectionState(),
          lastDisconnectSource: event.source,
        });
      }
      break;

    case "checkPermissions":
      await performCheckPermissions(deps);
      break;

    case "setCheckingPermissions":
      setDataConnectionState({
        ...getDataConnectionState(),
        isCheckingPermissions: action.value,
      });
      break;

    case "togglePairingMethod": {
      const currentState = getDataConnectionState();
      setDataConnectionState({
        ...currentState,
        pairingMethod:
          currentState.pairingMethod === "triple-reset"
            ? "a-b-reset"
            : "triple-reset",
      });
      break;
    }
  }
};

// =============================================================================
// State machine action implementations
// =============================================================================

/**
 * Connect to the flash connection (USB or Native Bluetooth) in order to flash.
 */
const performConnectFlash = async (deps: DataConnectionDeps): Promise<void> => {
  const connection = deps.connections.getDefaultFlashConnection();
  try {
    await connection.connect({ progress: progressCallback });
    const boardVersion = connection.getBoardVersion();
    await sendEvent({ type: "connectFlashSuccess", boardVersion }, deps);
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFlashFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Perform flash operation.
 */
const performFlash = async (deps: DataConnectionDeps): Promise<void> => {
  const state = getDataConnectionState();
  const connection = deps.connections.getDefaultFlashConnection();
  const hex = getHexType(state);

  try {
    const options: FlashOptions = {
      partial: true,
      minimumProgressIncrement: 0.01,
      progress: progressCallback,
    };
    await connection.flash(getFlashDataSource(hex), options);

    const deviceId = isWebUSBConnection(connection)
      ? connection.getDeviceId()
      : undefined;
    const bluetoothMicrobitName = deviceId
      ? deviceIdToMicrobitName(deviceId)
      : undefined;
    const boardVersion = connection.getBoardVersion();

    await sendEvent(
      {
        type: "flashSuccess",
        boardVersion,
        deviceId,
        bluetoothMicrobitName,
      },
      deps
    );
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "flashFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Connect to the data connection micro:bit (bluetooth or radio bridge).
 * If clearDevice is true, clears any existing device first (for fresh connections).
 *
 * Success is handled via the status listener (deviceConnected event) because
 * that route also handles internal reconnections.
 */
const performConnectData = async (
  clearDevice: boolean,
  deps: DataConnectionDeps
): Promise<void> => {
  const state = getDataConnectionState();
  // Only log for user-initiated connections, not reconnects.
  if (!state.isReconnecting) {
    const logMessage =
      state.type === DataConnectionType.Radio ? "radio-bridge" : "bluetooth";
    deps.logging.event({ type: "connect-user", message: logMessage });
  }
  try {
    const connection = deps.connections.getDataConnection();
    if (clearDevice) {
      await connection.clearDevice();
    }
    await connection.connect({ progress: progressCallback });
    // Success event (deviceConnected) is sent by the status listener.
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectDataFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Get hex type for the current flow.
 */
const getHexType = (state: DataConnectionState): HexType => {
  switch (state.type) {
    case DataConnectionType.NativeBluetooth:
    case DataConnectionType.WebBluetooth:
      return HexType.Bluetooth;
    case DataConnectionType.Radio:
      // Use radioFlowPhase to determine which hex to flash
      return state.radioFlowPhase === "bridge"
        ? HexType.RadioBridge
        : HexType.RadioRemote;
  }
};

/**
 * Disconnect from the data connection.
 */
const performDisconnectData = async (
  deps: DataConnectionDeps
): Promise<void> => {
  setDataConnectionState({
    ...getDataConnectionState(),
    isReconnecting: false,
  });
  await deps.connections.getDataConnection().disconnect();
};

const performCheckPermissions = async (
  deps: DataConnectionDeps
): Promise<void> => {
  const event = await checkPermissions(deps.connections.bluetooth);
  await sendEvent(event, deps);
};

/**
 * Initialize capabilities in state from connections.
 * Should be called once when the provider mounts.
 */
export const initializeCapabilities = async (connections: Connections) => {
  const [webBluetoothSupported, webUsbSupported] = await Promise.all([
    isWebBluetoothSupported(connections.bluetooth),
    isWebUsbSupported(connections.usb),
  ]);
  const store = useStore.getState();

  // Initialize bluetooth name filter from persisted settings
  const bluetoothMicrobitName = store.settings.bluetoothMicrobitName;
  if (bluetoothMicrobitName) {
    connections.bluetooth.setNameFilter(bluetoothMicrobitName);
  }

  store.setDataConnection({
    ...store.dataConnection,
    isWebBluetoothSupported: webBluetoothSupported,
    isWebUsbSupported: webUsbSupported,
  });
};

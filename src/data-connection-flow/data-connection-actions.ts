/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DeviceError, ProgressStage } from "@microbit/microbit-connection";
import { deviceIdToMicrobitName } from "../bt-pattern-utils";
import { ConnectionService } from "../connection-service";
import {
  DataConnectionAction,
  DataConnectionEvent,
  dataConnectionTransition,
} from "./data-connection-machine";
import {
  DataConnectionType,
  DataConnectionState,
  dataConnectionTypeToTransport,
  getInitialDataConnectionType,
} from "./data-connection-types";
import { Logging } from "../logging/logging";
import {
  isNativeBluetoothConnection,
  isWebUSBConnection,
} from "../device/connection-utils";
import { bluetoothUniversalHex, HexType } from "../device/get-hex-file";
import { useStore } from "../store";
import { downloadHex } from "../utils/fs-util";
import { StoredConnectionConfig } from "../hooks/use-connection-config-storage";

/**
 * Dependencies needed for state machine action execution.
 */
export interface DataConnectionDeps {
  connectionService: ConnectionService;
  dataCollectionMicrobitConnected: () => void;
  setConfig: (config: StoredConnectionConfig) => void;
  logging: Logging;
}

// =============================================================================
// State management helpers
// =============================================================================

const getDataConnectionState = () => useStore.getState().dataConnection;

/**
 * Update connection state in the store and persist relevant fields to config.
 */
const setDataConnectionState = (
  state: DataConnectionState,
  setConfig: (config: StoredConnectionConfig) => void
) => {
  useStore.getState().setDataConnection(state);
  setConfig({
    bluetoothMicrobitName: state.bluetoothMicrobitName,
    radioRemoteDeviceId: state.radioRemoteDeviceId,
  });
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
  setDataConnectionState(
    { ...getDataConnectionState(), step: result.step },
    deps.setConfig
  );

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
  // Always get fresh state - previous actions in the loop may have modified it
  const state = getDataConnectionState();

  switch (action.type) {
    case "reset": {
      // Reset flow state and set connection type for fresh connection
      const currentState = getDataConnectionState();
      const connectionType = currentState.hasSwitchedConnectionType
        ? currentState.type
        : getInitialDataConnectionType(currentState.isWebBluetoothSupported);
      setDataConnectionState(
        {
          ...currentState,
          type: connectionType,
          isReconnecting: false,
          hasFailedOnce: false,
          isStartingOver: false,
          hadSuccessfulConnection: false,
        },
        deps.setConfig
      );
      break;
    }

    case "setConnectionType": {
      setDataConnectionState(
        {
          ...state,
          type: action.connectionType,
          hasSwitchedConnectionType: true,
        },
        deps.setConfig
      );
      // Update the status listener for the new connection type
      const connType = dataConnectionTypeToTransport(action.connectionType);
      deps.connectionService.startListening(connType, action.connectionType);
      break;
    }

    case "setMicrobitName":
      if (event.type === "setMicrobitName") {
        setDataConnectionState(
          {
            ...getDataConnectionState(),
            bluetoothMicrobitName: event.name,
          },
          deps.setConfig
        );
      }
      break;

    case "setBluetoothName":
      if (event.type === "flashSuccess" && event.bluetoothMicrobitName) {
        setDataConnectionState(
          {
            ...getDataConnectionState(),
            bluetoothMicrobitName: event.bluetoothMicrobitName,
          },
          deps.setConfig
        );
      }
      break;

    case "setRadioRemoteDeviceId":
      if (event.type === "flashSuccess" && event.deviceId !== undefined) {
        setDataConnectionState(
          {
            ...getDataConnectionState(),
            radioRemoteDeviceId: event.deviceId,
          },
          deps.setConfig
        );
      }
      break;

    case "setRadioBridgeDeviceId":
      if (event.type === "flashSuccess" && event.deviceId !== undefined) {
        setDataConnectionState(
          {
            ...getDataConnectionState(),
            radioBridgeDeviceId: event.deviceId,
          },
          deps.setConfig
        );
      }
      break;

    case "connect":
      await performConnect(deps);
      break;

    case "flash":
      await performFlash(deps);
      break;

    case "connectBluetooth":
      await performConnectBluetooth(action.clearDevice, deps);
      break;

    case "connectMicrobits":
      await performConnectMicrobits(deps);
      break;

    case "downloadHexFile":
      downloadHex(bluetoothUniversalHex);
      break;

    case "notifyConnected":
      deps.dataCollectionMicrobitConnected();
      break;

    // Reconnect tracking actions
    case "setHasFailedOnce":
      setDataConnectionState(
        { ...getDataConnectionState(), hasFailedOnce: action.value },
        deps.setConfig
      );
      break;

    case "setIsStartingOver":
      setDataConnectionState(
        { ...getDataConnectionState(), isStartingOver: action.value },
        deps.setConfig
      );
      break;

    case "reconnect":
      await performReconnect(deps);
      break;

    // Connection state actions
    case "setReconnecting":
      setDataConnectionState(
        { ...getDataConnectionState(), isReconnecting: action.value },
        deps.setConfig
      );
      break;

    case "setRadioFlowPhase":
      setDataConnectionState(
        {
          ...getDataConnectionState(),
          radioFlowPhase: action.phase,
        },
        deps.setConfig
      );
      break;

    case "setConnected":
      setDataConnectionState(
        {
          ...getDataConnectionState(),
          hadSuccessfulConnection: true,
          isReconnecting: false,
        },
        deps.setConfig
      );
      break;

    // Listener management actions
    case "addStatusListener": {
      const dataConnectionType = getDataConnectionState().type;
      const connType = dataConnectionTypeToTransport(dataConnectionType);
      deps.connectionService.startListening(connType, dataConnectionType);
      break;
    }

    case "removeStatusListener":
      deps.connectionService.stopListening();
      break;

    // Disconnect action
    case "disconnect":
      await performDisconnect(deps);
      break;

    case "setDisconnectSource":
      if (event.type === "deviceDisconnected" && event.source) {
        setDataConnectionState(
          { ...getDataConnectionState(), lastDisconnectSource: event.source },
          deps.setConfig
        );
      }
      break;
  }
};

// =============================================================================
// State machine action implementations
// =============================================================================

/**
 * Perform USB or Native Bluetooth connect operation in order to flash.
 */
const performConnect = async (deps: DataConnectionDeps): Promise<void> => {
  const state = getDataConnectionState();
  const connection = deps.connectionService.getDefaultFlashConnection();

  if (isNativeBluetoothConnection(connection)) {
    const { bluetoothMicrobitName } = state;
    if (!bluetoothMicrobitName) {
      throw new Error("Name must be set by prior step for bluetooth");
    }
    connection.setNameFilter(bluetoothMicrobitName);
  }

  try {
    await deps.connectionService.connect(connection, {
      progress: progressCallback,
    });
    const boardVersion = connection.getBoardVersion();
    await sendEvent({ type: "connectSuccess", boardVersion }, deps);
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFailure", code: e.code }, deps);
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
  const connection = deps.connectionService.getDefaultFlashConnection();
  const hex = getHexType(state);

  try {
    await deps.connectionService.flash(connection, hex, progressCallback);

    const deviceId = isWebUSBConnection(connection)
      ? connection.getDeviceId()
      : undefined;
    const bluetoothMicrobitName = deviceId
      ? deviceIdToMicrobitName(deviceId)
      : undefined;
    const boardVersion = connection.getBoardVersion();

    // For native bluetooth, we need a delay before reconnecting
    if (state.type === DataConnectionType.NativeBluetooth) {
      // Android seems to require a longer delay than iOS which was OK with 2000.
      // TODO: investigate what we're actually waiting for.
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

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
 * Perform Bluetooth connection to a data connection micro:bit.
 */
const performConnectBluetooth = async (
  clearDevice: boolean,
  deps: DataConnectionDeps
): Promise<void> => {
  const state = getDataConnectionState();
  deps.logging.event({ type: "connect-user", message: "bluetooth" });
  try {
    await deps.connectionService.connectBluetooth(
      state.bluetoothMicrobitName,
      clearDevice
    );
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Perform radio bridge connection.
 */
const performConnectMicrobits = async (
  deps: DataConnectionDeps
): Promise<void> => {
  const state = getDataConnectionState();
  if (!state.radioRemoteDeviceId) {
    throw new Error("Radio remote device id not set");
  }
  deps.logging.event({ type: "connect-user", message: "radio-bridge" });
  try {
    await deps.connectionService.connectMicrobitsSerial(
      state.radioRemoteDeviceId
    );
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFailure", code: e.code }, deps);
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
 * Attempt automatic reconnection.
 * This is triggered by the flow machine when a connection is lost.
 */
const performReconnect = async (deps: DataConnectionDeps): Promise<void> => {
  const state = getDataConnectionState();

  try {
    switch (state.type) {
      case DataConnectionType.WebBluetooth:
      case DataConnectionType.NativeBluetooth:
        await deps.connectionService.connectBluetooth(
          state.bluetoothMicrobitName,
          false // Don't clear device, try to reconnect to same one
        );
        break;
      case DataConnectionType.Radio:
        // Only attempt serial reconnection if USB is connected.
        // If USB is disconnected (bridge failure), we can't reconnect via serial.
        if (
          state.radioRemoteDeviceId !== undefined &&
          deps.connectionService.isUsbDeviceConnected()
        ) {
          await deps.connectionService.connectMicrobitsSerial(
            state.radioRemoteDeviceId
          );
        } else {
          // USB is not connected, so we can't reconnect via serial.
          // This happens when the bridge micro:bit was unplugged. Fire a
          // disconnect event to trigger the normal failure handling flow
          // (which will show ConnectionLost after the retry limit).
          await sendEvent(
            { type: "deviceDisconnected", source: "bridge" },
            deps
          );
        }
        break;
    }
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Disconnect from the current device.
 */
const performDisconnect = async (deps: DataConnectionDeps): Promise<void> => {
  setDataConnectionState(
    { ...getDataConnectionState(), isReconnecting: false },
    deps.setConfig
  );
  await deps.connectionService.disconnect();
};

/**
 * Initialize capabilities in state from connectionService.
 * Should be called once when the provider mounts.
 */
export const initializeCapabilities = (connectionService: {
  isWebBluetoothSupported: () => boolean;
  isWebUsbSupported: () => boolean;
}) => {
  const currentState = getDataConnectionState();
  useStore.getState().setDataConnection({
    ...currentState,
    isWebBluetoothSupported: connectionService.isWebBluetoothSupported(),
    isWebUsbSupported: connectionService.isWebUsbSupported(),
  });
};

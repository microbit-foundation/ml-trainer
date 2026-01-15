/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createWebUSBConnection,
  DeviceError,
  ProgressCallback,
} from "@microbit/microbit-connection";
import { ConnectionService } from "../connection-service";
import { DataConnectionState } from "../data-connection-flow";
import { isNativeBluetoothConnection } from "../device/connection-utils";
import {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
  downloadTransition,
  getDownloadFlowType,
} from "./download-machine";
import { Logging } from "../logging/logging";
import { DownloadState, SameOrDifferentChoice } from "../model";
import { Settings } from "../settings";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/actions";
import { downloadHex } from "../utils/fs-util";
import { StoredConnectionConfig } from "../hooks/use-connection-config-storage";

/**
 * Dependencies needed for download actions.
 * These are gathered by the hook and passed to the actions.
 */
export interface DownloadDependencies {
  config: StoredConnectionConfig;
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  connectionService: ConnectionService;
  dataConnection: DataConnectionState;
  flashingProgressCallback: ProgressCallback;
  logging: Logging;
  /**
   * Sends disconnect event to the data connection state machine and waits for completion.
   */
  disconnect: () => Promise<void>;
}

/**
 * Build the context needed for state machine guards.
 */
const buildContext = (
  state: DownloadState,
  deps: DownloadDependencies
): DownloadFlowContext => ({
  hex: state.hex,
  microbitChoice: state.microbitChoice,
  bluetoothMicrobitName: state.bluetoothMicrobitName,
  connection: state.connection,
  showPreDownloadHelp: deps.settings.showPreDownloadHelp,
  hadSuccessfulConnection: deps.dataConnection.hadSuccessfulConnection,
  dataConnectionType: deps.dataConnection.type,
  isUsbConnected: deps.connectionService.isUsbDeviceConnected(),
  connectedBoardVersion: deps.connectionService.isUsbDeviceConnected()
    ? deps.connectionService.getUsbBoardVersion()
    : undefined,
});

/**
 * Get fresh download state from the store.
 * This ensures we always have the latest state, even mid-async-operation.
 */
const getDownloadState = () => useStore.getState().download;
const setDownloadState = (state: DownloadState) =>
  useStore.getState().setDownload(state);

/**
 * Execute a single action. Pure function that performs side effects.
 */
const executeAction = async (
  action: DownloadAction,
  event: DownloadEvent,
  deps: DownloadDependencies
): Promise<void> => {
  const state = getDownloadState(); // Fresh state for each action

  switch (action.type) {
    case "initializeDownload": {
      if (event.type !== "start") {
        throw new Error("initializeDownload requires start event");
      }
      setDownloadState({
        ...state,
        hex: event.hex,
        bluetoothMicrobitName: event.bluetoothMicrobitName,
      });
      break;
    }

    case "setMicrobitChoice":
      setDownloadState({ ...state, microbitChoice: action.choice });
      break;

    case "saveHelpPreference": {
      if (event.type === "next" && event.skipHelpNextTime !== undefined) {
        deps.setSettings({ showPreDownloadHelp: !event.skipHelpNextTime });
      }
      break;
    }

    case "connect":
      await performConnect(deps);
      break;

    case "flash":
      await performFlash(deps);
      break;

    case "downloadHexFile": {
      const currentState = getDownloadState();
      if (currentState.hex) {
        downloadHex(currentState.hex);
      }
      break;
    }

    case "disconnectDataConnection":
      // Send event to data connection state machine and wait for it to transition
      // to Idle and stop auto-reconnect attempts before proceeding
      await deps.disconnect();
      break;
  }
};

/**
 * Perform USB/Bluetooth connect operation.
 */
const performConnect = async (deps: DownloadDependencies): Promise<void> => {
  const state = getDownloadState();
  const { microbitChoice } = state;
  const actions = useStore.getState().actions;
  deps.logging.event({
    type: "hex-download",
    detail: {
      actions: actions.length,
      samples: getTotalNumSamples(actions),
    },
  });

  let connection = deps.connectionService.getDefaultFlashConnection();

  // Use temporary connection for "different" microbit choice
  if (microbitChoice === SameOrDifferentChoice.Different) {
    connection = createWebUSBConnection();
    const serialNumber = deps.connectionService.getUsbDeviceSerialNumber();
    if (serialNumber) {
      connection.setRequestDeviceExclusionFilters([{ serialNumber }]);
    }
  }

  // Set name filter for native bluetooth
  if (isNativeBluetoothConnection(connection) && state.bluetoothMicrobitName) {
    connection.setNameFilter(state.bluetoothMicrobitName);
  }

  try {
    await deps.connectionService.connect(connection, {
      progress: deps.flashingProgressCallback,
    });
    const boardVersion = connection.getBoardVersion();
    // Store connection for potential reuse
    setDownloadState({ ...getDownloadState(), connection });
    await sendEvent(
      {
        type: "connectSuccess",
        boardVersion: boardVersion ?? "V2",
      },
      deps
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
 * Perform flash operation.
 */
const performFlash = async (deps: DownloadDependencies): Promise<void> => {
  const state = getDownloadState();
  const { hex, connection } = state;

  if (!hex || !connection) {
    throw new Error("Hex and connection required for flashing");
  }

  try {
    await deps.connectionService.flash(
      connection,
      hex.hex,
      deps.flashingProgressCallback
    );
    await sendEvent({ type: "flashSuccess" }, deps);
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "flashFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

/**
 * Send an event to the state machine and execute resulting actions.
 */
const sendEvent = async (
  event: DownloadEvent,
  deps: DownloadDependencies
): Promise<void> => {
  const state = getDownloadState();
  const flowType = getDownloadFlowType(deps.dataConnection.type);
  const context = buildContext(state, deps);
  const result = downloadTransition(flowType, state.step, event, context);

  if (!result) {
    return;
  }

  // Update step first
  setDownloadState({ ...getDownloadState(), step: result.step });

  // Execute actions
  for (const action of result.actions) {
    await executeAction(action, event, deps);
  }
};

/**
 * Check if a transition exists for the given event.
 */
export const canTransition = (
  event: DownloadEvent,
  deps: DownloadDependencies
): boolean => {
  const state = getDownloadState();
  const flowType = getDownloadFlowType(deps.dataConnection.type);
  const context = buildContext(state, deps);
  return downloadTransition(flowType, state.step, event, context) !== null;
};

export { sendEvent, getDownloadState, setDownloadState };

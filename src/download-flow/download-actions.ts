/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ConnectionStatus,
  createUniversalHexFlashDataSource,
  createWebUSBConnection,
  DeviceError,
  FlashOptions,
  ProgressCallback,
  ProgressStage,
} from "@microbit/microbit-connection";
import { Connections } from "../connections-hooks";
import { DataConnectionState } from "../data-connection-flow";
import {
  DownloadAction,
  DownloadEvent,
  DownloadFlowContext,
  downloadTransition,
  getDownloadFlowType,
} from "./download-machine";
import { Logging } from "../logging/logging";
import { Settings } from "../settings";
import { useStore } from "../store";
import { getTotalNumSamples } from "../utils/actions";
import { downloadHex } from "../utils/fs-util";
import { DownloadState, SameOrDifferentChoice } from "./download-types";
import { checkPermissions } from "../shared-steps";

/**
 * Dependencies needed for download actions.
 * These are gathered by the hook and passed to the actions.
 */
export interface DownloadDependencies {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  connections: Connections;
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
): DownloadFlowContext => {
  const { usb } = deps.connections;
  const isUsbConnected = usb.status === ConnectionStatus.CONNECTED;
  return {
    hex: state.hex,
    microbitChoice: state.microbitChoice,
    bluetoothMicrobitName: deps.settings.bluetoothMicrobitName,
    connection: state.connection,
    showPreDownloadHelp: deps.settings.showPreDownloadHelp,
    hadSuccessfulConnection: deps.dataConnection.hadSuccessfulConnection,
    dataConnectionType: deps.dataConnection.type,
    isUsbConnected,
    connectedBoardVersion: isUsbConnected ? usb.getBoardVersion() : undefined,
  };
};

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
      // Set name filter from settings (already persisted)
      const bluetoothMicrobitName = deps.settings.bluetoothMicrobitName;
      if (bluetoothMicrobitName) {
        deps.connections.bluetooth.setNameFilter(bluetoothMicrobitName);
      }
      setDownloadState({
        ...state,
        hex: event.hex,
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

    case "togglePairingMethod": {
      setDownloadState({
        ...state,
        pairingMethod:
          state.pairingMethod === "triple-reset" ? "a-b-reset" : "triple-reset",
      });
      break;
    }

    case "setMicrobitName": {
      if (event.type === "setMicrobitName") {
        deps.connections.bluetooth.setNameFilter(event.name);
        deps.setSettings({ bluetoothMicrobitName: event.name });
      }
      break;
    }

    case "connectFlash":
      await performConnectFlash(deps);
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

    case "checkPermissions":
      await performCheckPermissions(deps);
      break;

    case "setCheckingPermissions":
      setDownloadState({
        ...getDownloadState(),
        isCheckingPermissions: action.value,
      });
      break;

    case "initializeFlashingProgress":
      useStore
        .getState()
        .setDownloadFlashingProgress(ProgressStage.Initializing, undefined);
      break;
  }
};

/**
 * Perform USB/Bluetooth connect operation for flashing.
 */
const performConnectFlash = async (
  deps: DownloadDependencies
): Promise<void> => {
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

  let connection = deps.connections.getDefaultFlashConnection();

  // Use temporary connection for "different" microbit choice
  if (microbitChoice === SameOrDifferentChoice.Different) {
    connection = createWebUSBConnection();
    const serialNumber = deps.connections.usb.getDevice()?.serialNumber;
    if (serialNumber) {
      connection.setRequestDeviceExclusionFilters([{ serialNumber }]);
    }
  }

  try {
    await connection.connect({ progress: deps.flashingProgressCallback });
    const boardVersion = connection.getBoardVersion();
    // Store connection for potential reuse
    setDownloadState({ ...getDownloadState(), connection });
    await sendEvent(
      {
        type: "connectFlashSuccess",
        boardVersion: boardVersion ?? "V2",
      },
      deps
    );
  } catch (e) {
    if (e instanceof DeviceError) {
      await sendEvent({ type: "connectFlashFailure", code: e.code }, deps);
    } else {
      throw e;
    }
  }
};

const performCheckPermissions = async (
  deps: DownloadDependencies
): Promise<void> => {
  const event = await checkPermissions(deps.connections.bluetooth);
  await sendEvent(event, deps);
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
    const options: FlashOptions = {
      partial: true,
      minimumProgressIncrement: 0.01,
      progress: deps.flashingProgressCallback,
    };
    await connection.flash(createUniversalHexFlashDataSource(hex.hex), options);
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

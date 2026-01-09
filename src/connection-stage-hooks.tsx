/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { BoardVersion } from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ConnectActions } from "./connect-actions";
import { useConnectActions } from "./connect-actions-hooks";
import {
  ConnectionStatus,
  useConnectStatus,
  useConnectStatusUpdater,
} from "./connect-status-hooks";
import { ConnectionStageActions } from "./connection-stage-actions";
import { useStorage } from "./hooks/use-storage";
import { useStore } from "./store";

export enum ConnectionFlowType {
  /**
   * This connection flow first flashes over WebUSB (with manual fallback)
   * and then connects over bluetooth.
   */
  ConnectWebBluetooth = "ConnectWebBluetooth",
  /**
   * This is a native-app bluetooth only connection flow that flashes over
   * bluetooth and then reconnects to the flashed device.
   */
  ConnectNativeBluetooth = "ConnectNativeBluetooth",
  /**
   * This is the first half of the two flows that set up a radio bridge connection.
   * It flashes the data collection micro:bit (the radio remote).
   */
  ConnectRadioRemote = "ConnectRadioRemote",
  /**
   * This is the second half of the two flows that set up a radio bridge connection
   * It flashes the bridge program over Web and then connects the two micro:bits over
   * radio by instructing the bridge micro:bit over WebUSB serial.
   */
  ConnectRadioBridge = "ConnectRadioBridge",
}

/**
 * This is the connection type from the perspective of how we end up talking
 * to the data connection micro:bit.
 */
export type ConnectionType = "bluetooth" | "radio";

export const flowTypeToConnectionType = (flowType: ConnectionFlowType) => {
  switch (flowType) {
    case ConnectionFlowType.ConnectNativeBluetooth:
    case ConnectionFlowType.ConnectWebBluetooth:
      return "bluetooth";
    case ConnectionFlowType.ConnectRadioBridge:
    case ConnectionFlowType.ConnectRadioRemote:
      return "radio";
    default:
      throw new Error();
  }
};

export enum ConnectionFlowStep {
  // Happy flow stages
  None = "None",
  Start = "Start",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  ManualFlashingTutorial = "ManualFlashingTutorial",
  ConnectBattery = "ConnectBattery",
  BluetoothPattern = "BluetoothPattern",
  WebBluetoothPreConnectTutorial = "WebBluetoothPreConnectTutorial",
  // Reset to pairing mode
  NativeBluetoothPreConnectTutorial = "NativeBluetoothPreConnectTutorial",

  // Transient stages (not user-controlled, not navigable)
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  BluetoothConnect = "BluetoothConnect",
  ConnectingMicrobits = "ConnectingMicrobits",
  FlashingInProgress = "FlashingInProgress",

  // Failure stages
  TryAgainReplugMicrobit = "TryAgainReplugMicrobit",
  TryAgainCloseTabs = "TryAgainCloseTabs",
  TryAgainWebUsbSelectMicrobit = "TryAgainWebUsbSelectMicrobit",
  TryAgainBluetoothSelectMicrobit = "TryAgainBluetoothSelectMicrobit",
  ConnectFailed = "ConnectFailed",
  BadFirmware = "BadFirmware",
  MicrobitUnsupported = "MicrobitUnsupported",
  WebUsbBluetoothUnsupported = "WebUsbBluetoothUnsupported",

  ConnectionLost = "ConnectionLoss",
  ReconnectFailed = "ReconnectFailed",
  ReconnectFailedTwice = "ReconnectFailedTwice",
}

export interface ConnectionStage {
  // For connection flow
  flowType: ConnectionFlowType;
  flowStep: ConnectionFlowStep;

  // Compatibility
  isWebBluetoothSupported: boolean;
  isWebUsbSupported: boolean;

  // Connection state
  bluetoothDeviceId?: number;
  bluetoothMicrobitName?: string;
  radioBridgeDeviceId?: number;
  radioRemoteDeviceId?: number;
  radioRemoteBoardVersion?: BoardVersion;
  hasFailedToReconnectTwice: boolean;

  // User Project
  makeCodeHex?: string;
}

type ConnectionStageContextValue = [
  ConnectionStage,
  (state: ConnectionStage) => void
];

const ConnectionStageContext =
  createContext<ConnectionStageContextValue | null>(null);

interface ConnectionStageProviderProps {
  children: ReactNode;
}

export interface StoredConnectionConfig {
  bluetoothMicrobitName?: string;
  radioRemoteDeviceId?: number;
}

/**
 * Determines the initial connection flow type based on platform capabilities.
 */
const getInitialFlowType = (
  isWebBluetoothSupported: boolean
): ConnectionFlowType => {
  if (isWebBluetoothSupported) {
    return ConnectionFlowType.ConnectWebBluetooth;
  }
  if (Capacitor.isNativePlatform()) {
    return ConnectionFlowType.ConnectNativeBluetooth;
  }
  return ConnectionFlowType.ConnectRadioRemote;
};

const getInitialConnectionStageValue = (
  config: StoredConnectionConfig,
  isWebBluetoothSupported: boolean,
  isWebUsbSupported: boolean
): ConnectionStage => {
  const flowType = getInitialFlowType(isWebBluetoothSupported);

  return {
    flowStep: ConnectionFlowStep.None,
    flowType,
    bluetoothMicrobitName: config.bluetoothMicrobitName,
    radioRemoteDeviceId: config.radioRemoteDeviceId,
    isWebBluetoothSupported,
    isWebUsbSupported,
    hasFailedToReconnectTwice: false,
  };
};

export const useConnectionConfigStorage = () => {
  return useStorage<StoredConnectionConfig>("local", "connectionConfig", {
    bluetoothMicrobitName: undefined,
    radioRemoteDeviceId: undefined,
  });
};

export const ConnectionStageProvider = ({
  children,
}: ConnectionStageProviderProps) => {
  const connectActions = useConnectActions();
  const [config, setConfig] = useConnectionConfigStorage();
  const [connectionStage, setConnStage] = useState<ConnectionStage>(
    getInitialConnectionStageValue(
      config,
      connectActions.isWebBluetoothSupported,
      connectActions.isWebUsbSupported
    )
  );
  const setConnectionStage = useCallback(
    (connStage: ConnectionStage) => {
      setConfig({
        bluetoothMicrobitName: connStage.bluetoothMicrobitName,
        radioRemoteDeviceId: connStage.radioRemoteDeviceId,
      });
      setConnStage(connStage);
    },
    [setConfig]
  );

  return (
    <ConnectionStageContext.Provider
      value={[connectionStage, setConnectionStage]}
    >
      {children}
    </ConnectionStageContext.Provider>
  );
};

export const useConnectionStage = (): {
  status: ConnectionStatus;
  stage: ConnectionStage;
  actions: ConnectionStageActions;
  isConnected: boolean;
  connectActions: ConnectActions;
  isDialogOpen: boolean;
} => {
  const connectionStageContextValue = useContext(ConnectionStageContext);
  if (!connectionStageContextValue) {
    throw new Error("Missing provider");
  }
  const [stage, setStage] = connectionStageContextValue;
  const connectActions = useConnectActions();
  const startConnect = useStore((s) => s.dataCollectionMicrobitConnectionStart);
  const dataCollectionMicrobitConnected = useStore(
    (s) => s.dataCollectionMicrobitConnected
  );
  const [, setStatus] = useConnectStatus();

  const actions = useMemo(() => {
    return new ConnectionStageActions(
      connectActions,
      stage,
      setStage,
      setStatus,
      startConnect,
      dataCollectionMicrobitConnected
    );
  }, [
    connectActions,
    stage,
    setStage,
    setStatus,
    startConnect,
    dataCollectionMicrobitConnected,
  ]);

  const status = useConnectStatusUpdater(
    flowTypeToConnectionType(stage.flowType),
    actions.handleConnectionStatus
  );
  const isConnected = status === ConnectionStatus.Connected;
  const isDialogOpen = stage.flowStep !== ConnectionFlowStep.None;

  return {
    status,
    stage,
    actions,
    isConnected,
    connectActions,
    isDialogOpen,
  };
};

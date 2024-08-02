import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { ConnectActions } from "./connect-actions";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionStageActions } from "./connection-stage-actions";
import { useStorage } from "./hooks/use-storage";
import {
  ConnectionStatus,
  useConnectStatus,
  useSetConnectStatus,
} from "./connect-status-hooks";

export enum ConnectionFlowType {
  Bluetooth = "bluetooth",
  RadioBridge = "bridge",
  RadioRemote = "remote",
}

export type ConnectionType = "bluetooth" | "radio";

export enum ConnectionFlowStep {
  // Happy flow stages
  None = "None",
  Start = "Start",
  ConnectCable = "ConnectCable",
  WebUsbFlashingTutorial = "WebUsbFlashingTutorial",
  ManualFlashingTutorial = "ManualFlashingTutorial",
  ConnectBattery = "ConnectBattery",
  EnterBluetoothPattern = "EnterBluetoothPattern",
  ConnectBluetoothTutorial = "ConnectBluetoothTutorial",

  // Stages that are not user-controlled
  WebUsbChooseMicrobit = "WebUsbChooseMicrobit",
  ConnectingBluetooth = "ConnectingBluetooth",
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
  flowStep: ConnectionFlowStep;
  flowType: ConnectionFlowType;

  // Compatibility
  isWebBluetoothSupported: boolean;
  isWebUsbSupported: boolean;

  // Connection state
  connType: "bluetooth" | "radio";
  bluetoothDeviceId?: number;
  bluetoothMicrobitName?: string;
  radioBridgeDeviceId?: number;
  radioRemoteDeviceId?: number;
  hasFailedToReconnectTwice: boolean;
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

interface StoredConnectionConfig {
  bluetoothMicrobitName?: string;
  radioRemoteDeviceId?: number;
}

const getInitialConnectionStageValue = (
  config: StoredConnectionConfig
): ConnectionStage => ({
  flowStep: ConnectionFlowStep.None,
  flowType: ConnectionFlowType.Bluetooth,
  bluetoothMicrobitName: config.bluetoothMicrobitName,
  radioRemoteDeviceId: config.radioRemoteDeviceId,
  connType: "bluetooth",
  isWebBluetoothSupported: true,
  isWebUsbSupported: true,
  hasFailedToReconnectTwice: false,
});

export const ConnectionStageProvider = ({
  children,
}: ConnectionStageProviderProps) => {
  const [config, setConfig] = useStorage<StoredConnectionConfig>(
    "local",
    "connectionConfig",
    { bluetoothMicrobitName: undefined, radioRemoteDeviceId: undefined }
  );
  const [connectionStage, setConnStage] = useState<ConnectionStage>(
    getInitialConnectionStageValue(config)
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
} => {
  const connectionStageContextValue = useContext(ConnectionStageContext);
  if (!connectionStageContextValue) {
    throw new Error("Missing provider");
  }
  const [stage, setStage] = connectionStageContextValue;
  const navigate = useNavigate();
  const connectActions = useConnectActions();
  const setStatus = useSetConnectStatus();

  const actions = useMemo(() => {
    return new ConnectionStageActions(
      connectActions,
      navigate,
      stage,
      setStage,
      setStatus
    );
  }, [connectActions, navigate, stage, setStage, setStatus]);

  const status = useConnectStatus(
    stage.connType,
    actions.handleConnectionStatus
  );
  const isConnected = status === ConnectionStatus.Connected;

  return {
    status,
    stage,
    actions,
    isConnected,
    connectActions,
  };
};

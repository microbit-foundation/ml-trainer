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
import { useConnectStatus, useSetConnectStatus } from "./connect-status-hooks";

export enum ConnectionFlowType {
  Bluetooth = "bluetooth",
  RadioBridge = "bridge",
  RadioRemote = "remote",
}

export enum ConnectionStatus {
  // Initial / restarted connection state
  NotConnected = "NotConnected",
  ChoosingDevice = "ChoosingDevice",
  Connecting = "Connecting",
  Connected = "Connected",
  // Have connected / attempted connection previously
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  FailedToConnect = "FailedToConnect",
  FailedToReconnectManually = "FailedToReconnectManually",
  FailedToReconnectAutomatically = "FailedToReconnectAutomatically",
  FailedToReconnectTwice = "FailedToReconnectTwice",
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
  TryAgainSelectMicrobit = "TryAgainSelectMicrobit",
  TryAgainBluetoothConnect = "TryAgainBluetoothConnect",
  BadFirmware = "BadFirmware",
  MicrobitUnsupported = "MicrobitUnsupported",
  WebUsbBluetoothUnsupported = "WebUsbBluetoothUnsupported",

  ReconnectAutoFail = "ReconnectAutoFail",
  ReconnectManualFail = "ReconnectManualFail",
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

const getInitialConnectionStageValue = (
  microbitName: string | undefined
): ConnectionStage => ({
  flowStep: ConnectionFlowStep.None,
  flowType: ConnectionFlowType.Bluetooth,
  bluetoothMicrobitName: microbitName,
  connType: "bluetooth",
  isWebBluetoothSupported: true,
  isWebUsbSupported: true,
});

export const ConnectionStageProvider = ({
  children,
}: ConnectionStageProviderProps) => {
  const [val, setMicrobitName] = useStorage<{
    value?: string;
  }>("local", "microbitName", { value: undefined });
  const [connectionStage, setConnStage] = useState<ConnectionStage>(
    getInitialConnectionStageValue(val.value)
  );
  const setConnectionStage = useCallback(
    (connStage: ConnectionStage) => {
      setMicrobitName({ value: connStage.bluetoothMicrobitName });
      setConnStage(connStage);
    },
    [setMicrobitName]
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

  const status = useConnectStatus(actions.handleConnectionStatus);

  const isConnected = useMemo(
    () => status === ConnectionStatus.Connected,
    [status]
  );

  return {
    stage,
    actions,
    isConnected,
    connectActions,
  };
};

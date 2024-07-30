import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StatusListener, StatusListenerType } from "./connect-actions";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionFlowType } from "./connection-stage-hooks";

export enum ConnectionStatus {
  /**
   * Represents the initial connection status.
   */
  NotConnected = "NotConnected",
  /**
   * Connecting occurs for the initial connection.
   */
  Connecting = "Connecting",
  /**
   * Connected.
   */
  Connected = "Connected",
  /**
   * Reconnecting occurs for the subsequent connections after the initial one.
   */
  Reconnecting = "Reconnecting",
  /**
   * Disconnected. The disconnection is triggered by the user.
   */
  Disconnected = "Disconnected",
  /**
   * Failure to establish initial connection triggered by the user.
   */
  FailedToConnect = "FailedToConnect",
  /**
   * Failure to reconnect triggered by the user.
   */
  FailedToReconnect = "FailedToReconnect",
  /**
   *  Connection lost. Auto-reconnect was attempted, but failed.
   */
  ConnectionLost = "ConnectionLost",
  /**
   * A subsequent failure to reconnect after a reconnection failure.
   * The initial reconnection failure may have been triggered automatically
   * or by the user (ConnectionLost or FailedToReconnect).
   */
  FailedToReconnectTwice = "FailedToReconnectTwice",
}

type ConnectStatusContextValue = [
  ConnectionStatus,
  (status: ConnectionStatus) => void
];

const ConnectStatusContext = createContext<ConnectStatusContextValue | null>(
  null
);

interface ConnectStatusProviderProps {
  children: ReactNode;
}

export const ConnectStatusProvider = ({
  children,
}: ConnectStatusProviderProps) => {
  const connectStatusContextValue = useState<ConnectionStatus>(
    ConnectionStatus.NotConnected
  );

  const set = useCallback(
    (s: ConnectionStatus) => {
      console.log(s);
      connectStatusContextValue[1](s);
    },
    [connectStatusContextValue]
  );
  return (
    <ConnectStatusContext.Provider value={[connectStatusContextValue[0], set]}>
      {children}
    </ConnectStatusContext.Provider>
  );
};

export const useSetConnectStatus = (): ((status: ConnectionStatus) => void) => {
  const connectStatusContextValue = useContext(ConnectStatusContext);
  if (!connectStatusContextValue) {
    throw new Error("Missing provider");
  }
  const [, setStatus] = connectStatusContextValue;

  return setStatus;
};

export const useConnectStatus = (
  handleStatus?: (status: ConnectionStatus, type?: ConnectionFlowType) => void
): ConnectionStatus => {
  const connectStatusContextValue = useContext(ConnectStatusContext);
  if (!connectStatusContextValue) {
    throw new Error("Missing provider");
  }
  const [connectionStatus, setConnectionStatus] = connectStatusContextValue;
  const connectActions = useConnectActions();
  const prevDeviceStatus = useRef<DeviceConnectionStatus | null>(null);
  const hasAttempedReconnect = useRef<boolean>(false);
  const hasRadioConnected = useRef<boolean>(false);

  useEffect(() => {
    const listener: StatusListener = ({ status: deviceStatus, type }) => {
      const nextState = getNextConnectionState(
        connectionStatus,
        deviceStatus,
        prevDeviceStatus.current,
        type,
        hasAttempedReconnect,
        hasRadioConnected
      );
      prevDeviceStatus.current = deviceStatus;
      if (nextState) {
        handleStatus && handleStatus(nextState.status, nextState.flowType);
        setConnectionStatus(nextState.status);
      }
    };
    connectActions.addStatusListener(listener);
    return () => {
      connectActions.removeStatusListener();
    };
  }, [connectActions, connectionStatus, handleStatus, setConnectionStatus]);

  return connectionStatus;
};

const getNextConnectionState = (
  currStatus: ConnectionStatus,
  deviceStatus: DeviceConnectionStatus,
  prevDeviceStatus: DeviceConnectionStatus | null,
  type: StatusListenerType,
  hasAttempedReconnect: MutableRefObject<boolean>,
  hasRadioConnected: MutableRefObject<boolean>
): { status: ConnectionStatus; flowType: ConnectionFlowType } | undefined => {
  console.log(type, deviceStatus);
  // We are using usb status to infer the radio bridge device status.
  // Ignore USB status updates when radio connection is not established.
  if (!hasRadioConnected.current && type === "usb") {
    return undefined;
  }
  const flowType =
    type === "usb"
      ? ConnectionFlowType.RadioBridge
      : type === "radioRemote"
      ? ConnectionFlowType.RadioRemote
      : ConnectionFlowType.Bluetooth;
  if (
    // Disconnection happens for newly started / restarted
    // connection flows when clearing device
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    currStatus === ConnectionStatus.NotConnected
  ) {
    hasRadioConnected.current = false;
    return { status: ConnectionStatus.NotConnected, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.CONNECTED) {
    hasAttempedReconnect.current = false;
    if (type === "radioRemote") {
      hasRadioConnected.current = true;
    }
    return { status: ConnectionStatus.Connected, flowType };
  }
  if (
    currStatus === ConnectionStatus.Connecting &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    return { status: ConnectionStatus.FailedToConnect, flowType };
  }
  if (
    // If user does not select a device for bluetooth connection
    type === "bluetooth" &&
    deviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE &&
    prevDeviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE
  ) {
    return { status: ConnectionStatus.FailedToConnect, flowType };
  }
  if (
    hasAttempedReconnect.current &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    return { status: ConnectionStatus.FailedToReconnectTwice, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    hasAttempedReconnect.current = true;
    return { status: ConnectionStatus.FailedToReconnect, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.RECONNECTING
  ) {
    hasAttempedReconnect.current = true;
    return { status: ConnectionStatus.ConnectionLost, flowType };
  }
  if (deviceStatus === DeviceConnectionStatus.DISCONNECTED) {
    return { status: ConnectionStatus.Disconnected, flowType };
  }
  if (
    deviceStatus === DeviceConnectionStatus.RECONNECTING ||
    deviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    const newStatus =
      currStatus === ConnectionStatus.NotConnected ||
      currStatus === ConnectionStatus.FailedToConnect
        ? ConnectionStatus.Connecting
        : ConnectionStatus.Reconnecting;
    return { status: newStatus, flowType };
  }
  return undefined;
};

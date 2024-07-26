import {
  ConnectionStatusEvent,
  ConnectionStatus as DeviceConnectionStatus,
} from "@microbit/microbit-connection";
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
import { useConnectActions } from "./connect-actions-hooks";

export enum ConnectionStatus {
  /**
   * Represents the initial connection status.
   */
  NotConnected = "NotConnected",
  /**
   * The user is choosing bluetooth device.
   * Used for determining when user has not selected a device.
   */
  ChoosingBluetoothDevice = "ChoosingDevice",
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
  return (
    <ConnectStatusContext.Provider value={connectStatusContextValue}>
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

  const set = useCallback(
    (s: ConnectionStatus) => {
      console.log(s);
      setStatus(s);
    },
    [setStatus]
  );

  return set;
};

export const useConnectStatus = (
  handleStatus?: (status: ConnectionStatus) => void
): ConnectionStatus => {
  const connectStatusContextValue = useContext(ConnectStatusContext);
  if (!connectStatusContextValue) {
    throw new Error("Missing provider");
  }
  const [status, setStatus] = connectStatusContextValue;
  const connectActions = useConnectActions();
  const prevDeviceStatus = useRef<DeviceConnectionStatus | null>(null);
  const hasAttempedReconnect = useRef<boolean>(false);

  const set = useCallback(
    (s: ConnectionStatus) => {
      console.log(s);
      setStatus(s);
    },
    [setStatus]
  );
  useEffect(() => {
    const listener = ({ status: deviceStatus }: ConnectionStatusEvent) => {
      const newStatus = getNextConnectionStatus(
        status,
        deviceStatus,
        prevDeviceStatus.current,
        hasAttempedReconnect
      );
      prevDeviceStatus.current = deviceStatus;
      if (newStatus) {
        handleStatus && handleStatus(newStatus);
        setStatus(newStatus);
      }
    };
    connectActions.addStatusListener("bluetooth", listener);
    return () => {
      connectActions.removeStatusListener("bluetooth", listener);
    };
  }, [connectActions, handleStatus, set, setStatus, status]);

  return status;
};

const getNextConnectionStatus = (
  status: ConnectionStatus,
  deviceStatus: DeviceConnectionStatus,
  prevDeviceStatus: DeviceConnectionStatus | null,
  hasAttempedReconnect: MutableRefObject<boolean>
) => {
  if (deviceStatus === DeviceConnectionStatus.CONNECTED) {
    hasAttempedReconnect.current = false;
    return ConnectionStatus.Connected;
  }
  if (
    hasAttempedReconnect.current &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    return ConnectionStatus.FailedToReconnectTwice;
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    hasAttempedReconnect.current = true;
    return ConnectionStatus.FailedToReconnect;
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.RECONNECTING
  ) {
    hasAttempedReconnect.current = true;
    return ConnectionStatus.ConnectionLost;
  }
  if (
    (status === ConnectionStatus.Connecting &&
      deviceStatus === DeviceConnectionStatus.DISCONNECTED) ||
    (status === ConnectionStatus.ChoosingBluetoothDevice &&
      deviceStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE)
  ) {
    return ConnectionStatus.FailedToConnect;
  }
  if (deviceStatus === DeviceConnectionStatus.DISCONNECTED) {
    return ConnectionStatus.Disconnected;
  }
  if (
    deviceStatus === DeviceConnectionStatus.RECONNECTING ||
    deviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    return status === ConnectionStatus.ChoosingBluetoothDevice ||
      status === ConnectionStatus.FailedToConnect
      ? ConnectionStatus.Connecting
      : ConnectionStatus.Reconnecting;
  }
  return undefined;
};

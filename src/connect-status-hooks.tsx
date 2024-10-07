import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StatusListener } from "./connect-actions";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionFlowType, ConnectionType } from "./connection-stage-hooks";
import { getNextConnectionState } from "./get-next-connection-state";

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
   * Reconnecting explicitly occurs when a reconnection is triggered by the user.
   */
  ReconnectingExplicitly = "ReconnectingExplicitly",
  /**
   * Reconnecting automatically occurs when a reconnection is triggered automatically.
   * This happens before a connection lost is declared.
   */
  ReconnectingAutomatically = "ReconnectingAutomatically",
  /**
   * Disconnected. The disconnection is triggered by the user.
   */
  Disconnected = "Disconnected",
  /**
   * Failure to select a device by the user.
   */
  FailedToSelectBluetoothDevice = "FailedToSelectBluetoothDevice",
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

export const useConnectStatus = (): [
  ConnectionStatus,
  (status: ConnectionStatus) => void
] => {
  const connectStatusContextValue = useContext(ConnectStatusContext);
  if (!connectStatusContextValue) {
    throw new Error("Missing provider");
  }
  return connectStatusContextValue;
};

export const useConnectStatusUpdater = (
  currConnType: ConnectionType,
  handleStatus: (status: ConnectionStatus, type: ConnectionFlowType) => void
): ConnectionStatus => {
  const [connectionStatus, setConnectionStatus] = useConnectStatus();
  const connectActions = useConnectActions();
  const isBrowserTabVisible = useBrowserTabVisibility();
  const prevDeviceStatus = useRef<DeviceConnectionStatus | null>(null);
  const [hasAttempedReconnect, setHasAttemptedReconnect] =
    useState<boolean>(false);
  const [onFirstConnectAttempt, setOnFirstConnectAttempt] =
    useState<boolean>(true);

  useEffect(() => {
    if (
      !isBrowserTabVisible &&
      currConnType === "radio" &&
      connectionStatus === ConnectionStatus.Connected
    ) {
      // Show reconnecting when user hides browser tab and is radio connected
      setConnectionStatus(ConnectionStatus.ReconnectingAutomatically);
      return;
    }
    const listener: StatusListener = ({ status: deviceStatus, type }) => {
      const nextState = getNextConnectionState({
        currConnType,
        currStatus: connectionStatus,
        deviceStatus,
        prevDeviceStatus: prevDeviceStatus.current,
        type,
        hasAttempedReconnect,
        setHasAttemptedReconnect,
        onFirstConnectAttempt,
        setOnFirstConnectAttempt,
      });
      prevDeviceStatus.current = deviceStatus;
      if (nextState && isBrowserTabVisible) {
        handleStatus && handleStatus(nextState.status, nextState.flowType);
        setConnectionStatus(nextState.status);
      }
    };
    // Only add relevant connection type status listener
    connectActions.removeStatusListener();
    connectActions.addStatusListener(listener, currConnType);
    return () => {
      connectActions.removeStatusListener();
    };
  }, [
    connectActions,
    connectionStatus,
    currConnType,
    handleStatus,
    hasAttempedReconnect,
    isBrowserTabVisible,
    onFirstConnectAttempt,
    setConnectionStatus,
  ]);

  return connectionStatus;
};

const useBrowserTabVisibility = (): boolean => {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const listener = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", listener, false);
    return () => {
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);

  return visible;
};

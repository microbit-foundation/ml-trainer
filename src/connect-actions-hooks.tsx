import {
  ConnectionStatus as DeviceConnectionStatus,
  ConnectionStatusEvent,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConnectActions } from "./connect-actions";
import { useLogging } from "./logging/logging-hooks";
import { ConnectionStatus } from "./connection-stage-hooks";

interface ConnectContextValue {
  usb: MicrobitWebUSBConnection;
  bluetooth: MicrobitWebBluetoothConnection;
}

const ConnectContext = createContext<ConnectContextValue | null>(null);

interface ConnectProviderProps {
  children: ReactNode;
}

export const ConnectProvider = ({ children }: ConnectProviderProps) => {
  const usb = useMemo(() => new MicrobitWebUSBConnection(), []);
  const bluetooth = useMemo(() => new MicrobitWebBluetoothConnection(), []);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      await usb.initialize();
      await bluetooth.initialize();
    };
    if (!isInitialized.current) {
      void initialize();
      isInitialized.current = true;
    }
  }, [bluetooth, usb]);

  return (
    <ConnectContext.Provider value={{ usb, bluetooth }}>
      {children}
    </ConnectContext.Provider>
  );
};

export const useConnectActions = (): ConnectActions => {
  const connectContextValue = useContext(ConnectContext);
  if (!connectContextValue) {
    throw new Error("Missing provider");
  }
  const { usb, bluetooth } = connectContextValue;
  const logging = useLogging();

  const connectActions = useMemo(
    () => new ConnectActions(logging, usb, bluetooth),
    [bluetooth, logging, usb]
  );

  return connectActions;
};

const getNextConnectionStatus = (
  status: ConnectionStatus,
  deviceStatus: DeviceConnectionStatus,
  prevDeviceStatus: DeviceConnectionStatus | null,
  numReconnectAttempt: MutableRefObject<number>
) => {
  if (deviceStatus === DeviceConnectionStatus.CONNECTED) {
    return ConnectionStatus.Connected;
  }
  if (
    numReconnectAttempt.current > 0 &&
    deviceStatus === DeviceConnectionStatus.DISCONNECTED
  ) {
    numReconnectAttempt.current = 0;
    return ConnectionStatus.FailedToReconnectTwice;
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    numReconnectAttempt.current++;
    return ConnectionStatus.FailedToReconnectManually;
  }
  if (
    deviceStatus === DeviceConnectionStatus.DISCONNECTED &&
    prevDeviceStatus === DeviceConnectionStatus.RECONNECTING
  ) {
    numReconnectAttempt.current++;
    return ConnectionStatus.FailedToReconnectAutomatically;
  }
  if (deviceStatus === DeviceConnectionStatus.DISCONNECTED) {
    return ConnectionStatus.Disconnected;
  }
  if (
    deviceStatus === DeviceConnectionStatus.RECONNECTING ||
    deviceStatus === DeviceConnectionStatus.CONNECTING
  ) {
    return ConnectionStatus.None === status
      ? ConnectionStatus.Connecting
      : ConnectionStatus.Reconnecting;
  }
  return status;
};

export const useConnectStatus = (
  handleStatus?: (status: ConnectionStatus) => void
): ConnectionStatus => {
  const connectActions = useConnectActions();
  const prevDeviceStatus = useRef<DeviceConnectionStatus | null>(null);
  const numReconnectAttempt = useRef<number>(0);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.None);

  const set = useCallback((s: ConnectionStatus) => {
    console.log(s);
    setStatus(s);
  }, []);
  useEffect(() => {
    const listener = ({ status: deviceStatus }: ConnectionStatusEvent) => {
      const newStatus = getNextConnectionStatus(
        status,
        deviceStatus,
        prevDeviceStatus.current,
        numReconnectAttempt
      );
      prevDeviceStatus.current = deviceStatus;
      handleStatus && handleStatus(newStatus);
      setStatus(newStatus);
    };
    connectActions.addStatusListener("bluetooth", listener);
    return () => {
      connectActions.removeStatusListener("bluetooth", listener);
    };
  }, [connectActions, handleStatus, set, status]);

  return status;
};

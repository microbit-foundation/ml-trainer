import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ConnectActions } from "./connect-actions";
import { useLogging } from "./logging/logging-hooks";

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

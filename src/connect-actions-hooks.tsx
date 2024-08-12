import {
  MicrobitRadioBridgeConnection,
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
  useState,
} from "react";
import { ConnectActions } from "./connect-actions";
import { useLogging } from "./logging/logging-hooks";

interface ConnectContextValue {
  usb: MicrobitWebUSBConnection;
  bluetooth: MicrobitWebBluetoothConnection;
  radioBridge: MicrobitRadioBridgeConnection;
}

const ConnectContext = createContext<ConnectContextValue | null>(null);

interface ConnectProviderProps {
  children: ReactNode;
}

export const ConnectProvider = ({ children }: ConnectProviderProps) => {
  const usb = useRef(new MicrobitWebUSBConnection()).current;
  const logging = useRef(useLogging()).current;
  const bluetooth = useRef(
    new MicrobitWebBluetoothConnection({ logging })
  ).current;
  const radioBridge = useRef(
    new MicrobitRadioBridgeConnection(usb, { logging })
  ).current;
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      await usb.initialize();
      await bluetooth.initialize();
      await radioBridge.initialize();
      setIsInitialized(true);
    };
    if (!isInitialized) {
      void initialize();
    }
  }, [bluetooth, isInitialized, radioBridge, usb]);

  return (
    <ConnectContext.Provider value={{ usb, bluetooth, radioBridge }}>
      {isInitialized ? children : <></>}
    </ConnectContext.Provider>
  );
};

export const useConnectActions = (): ConnectActions => {
  const connectContextValue = useContext(ConnectContext);
  if (!connectContextValue) {
    throw new Error("Missing provider");
  }
  const { usb, bluetooth, radioBridge } = connectContextValue;
  const logging = useLogging();

  const connectActions = useMemo(
    () => new ConnectActions(logging, usb, bluetooth, radioBridge),
    [bluetooth, logging, radioBridge, usb]
  );

  return connectActions;
};

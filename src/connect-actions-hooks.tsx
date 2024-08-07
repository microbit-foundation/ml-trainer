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
  const usb = useMemo(() => new MicrobitWebUSBConnection(), []);
  const logging = useLogging();
  const bluetooth = useMemo(
    () => new MicrobitWebBluetoothConnection({ logging }),
    [logging]
  );
  const radioBridge = useMemo(
    () =>
      new MicrobitRadioBridgeConnection(usb, {
        logging,
      }),
    [logging, usb]
  );
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      await usb.initialize();
      await bluetooth.initialize();
      await radioBridge.initialize();
    };
    if (!isInitialized.current) {
      void initialize();
      isInitialized.current = true;
    }
  }, [bluetooth, radioBridge, usb]);

  return (
    <ConnectContext.Provider value={{ usb, bluetooth, radioBridge }}>
      {children}
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

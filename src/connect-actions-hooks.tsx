/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  BoardVersion,
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
import { MockWebUSBConnection } from "./device/mockUsb";
import { MockWebBluetoothConnection } from "./device/mockBluetooth";

interface ConnectContextValue {
  usb: MicrobitWebUSBConnection;
  bluetooth: MicrobitWebBluetoothConnection;
  radioBridge: MicrobitRadioBridgeConnection;
  radioRemoteBoardVersion: React.MutableRefObject<BoardVersion | undefined>;
}

const ConnectContext = createContext<ConnectContextValue | null>(null);

interface ConnectProviderProps {
  children: ReactNode;
}

const isMockDeviceMode = () => true;
// TODO: Use cookie mechanism for isMockDeviceMode.
// We use a cookie set from the e2e tests. Avoids having separate test and live builds.
// Boolean(
//   document.cookie.split("; ").find((row) => row.startsWith("mockDevice="))
// );

export const ConnectProvider = ({ children }: ConnectProviderProps) => {
  const usb = useRef(
    isMockDeviceMode()
      ? new MockWebUSBConnection()
      : new MicrobitWebUSBConnection()
  ).current as MicrobitWebUSBConnection;
  const logging = useRef(useLogging()).current;
  const bluetooth = useRef(
    isMockDeviceMode()
      ? new MockWebBluetoothConnection()
      : new MicrobitWebBluetoothConnection({ logging })
  ).current as MicrobitWebBluetoothConnection;
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

  const radioRemoteBoardVersion = useRef<BoardVersion | undefined>();

  return (
    <ConnectContext.Provider
      value={{ usb, bluetooth, radioBridge, radioRemoteBoardVersion }}
    >
      {isInitialized ? children : <></>}
    </ConnectContext.Provider>
  );
};

export const useConnectActions = (): ConnectActions => {
  const connectContextValue = useContext(ConnectContext);
  if (!connectContextValue) {
    throw new Error("Missing provider");
  }
  const { usb, bluetooth, radioBridge, radioRemoteBoardVersion } =
    connectContextValue;
  const logging = useLogging();

  const connectActions = useMemo(
    () =>
      new ConnectActions(
        logging,
        usb,
        bluetooth,
        radioBridge,
        radioRemoteBoardVersion
      ),
    [bluetooth, logging, radioBridge, radioRemoteBoardVersion, usb]
  );

  return connectActions;
};

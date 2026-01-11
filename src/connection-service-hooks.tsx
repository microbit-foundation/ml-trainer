/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
  useRef,
  useState,
} from "react";
import { ConnectionService } from "./connection-service";
import { useLogging } from "./logging/logging-hooks";

interface ConnectionServiceContextValue {
  connectionService: ConnectionService;
}

const ConnectionServiceContext =
  createContext<ConnectionServiceContextValue | null>(null);

interface ConnectionServiceProviderProps {
  children: ReactNode;
  usb: MicrobitWebUSBConnection;
  bluetooth: MicrobitWebBluetoothConnection;
  radioBridge: MicrobitRadioBridgeConnection;
}

export const ConnectionServiceProvider = ({
  children,
  usb,
  bluetooth,
  radioBridge,
}: ConnectionServiceProviderProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const logging = useLogging();
  const connectionServiceRef = useRef<ConnectionService>();

  if (!connectionServiceRef.current) {
    connectionServiceRef.current = new ConnectionService(
      logging,
      usb,
      bluetooth,
      radioBridge
    );
  }

  useEffect(() => {
    if (!isInitialized && connectionServiceRef.current) {
      void connectionServiceRef.current.initialize().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  return (
    <ConnectionServiceContext.Provider
      value={{ connectionService: connectionServiceRef.current }}
    >
      {isInitialized ? children : <></>}
    </ConnectionServiceContext.Provider>
  );
};

/**
 * Returns the ConnectionService instance.
 *
 * UI components should use higher-level hooks for the data subscription or UI
 * flow they are concerned with.
 */
export const useConnectionService = (): ConnectionService => {
  const context = useContext(ConnectionServiceContext);
  if (!context) {
    throw new Error("Missing provider");
  }
  return context.connectionService;
};

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ConnectionStatusEvent,
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DataConnectionType,
  dataConnectionTypeToTransport,
} from "./data-connection-flow";
import { isNativePlatform } from "./platform";
import { useStore } from "./store";

/**
 * Union type for connections that can be used for data collection.
 */
export type DataConnection =
  | MicrobitWebBluetoothConnection
  | MicrobitRadioBridgeConnection;

/**
 * Union type for connections that can be used for flashing.
 */
export type FlashConnection =
  | MicrobitWebBluetoothConnection
  | MicrobitWebUSBConnection;

/**
 * Tracks mutable connection state.
 */
interface ConnectionsRefValue {
  connection: DataConnection;
  type: DataConnectionType;
  listener: ((event: ConnectionStatusEvent) => void) | undefined;
}

/**
 * Holds the three connection instances and provides methods to access them.
 *
 * This object has a stable identity and uses refs internally for mutable state.
 * Use {@link useDataConnection} for reactive access to the current data connection.
 */
export interface Connections {
  // Prefer getDefaultFlashConnection / getDataConnection.
  radioBridge: MicrobitRadioBridgeConnection;
  bluetooth: MicrobitWebBluetoothConnection;
  usb: MicrobitWebUSBConnection;

  initialize(): Promise<void>;

  /**
   * Get the default connection for flashing based on the platform.
   * Returns bluetooth on native platforms, USB on web.
   */
  getDefaultFlashConnection(): FlashConnection;

  /**
   * Get the data connection based on the store's connection type.
   * Returns bluetooth for Bluetooth connection types, radioBridge for Radio.
   */
  getDataConnection(): DataConnection;

  getDataConnectionType(): DataConnectionType;

  /**
   * Sets the data connection type.
   *
   * This writes through to the store and updates the connection returned by
   * {@link getDataConnection}.
   */
  setDataConnectionType(connectionType: DataConnectionType): void;

  /**
   * Hook for the data connection state machine to receive events from the
   * current data connection.
   */
  setDataConnectionListener(
    listener: ((event: ConnectionStatusEvent) => void) | undefined
  ): void;
}

/**
 * Create a Connections object with the given connection instances.
 */
const createConnections = (
  usb: MicrobitWebUSBConnection,
  bluetooth: MicrobitWebBluetoothConnection,
  radioBridge: MicrobitRadioBridgeConnection,
  persistType: (type: DataConnectionType) => void,
  ref: MutableRefObject<ConnectionsRefValue>
): Connections => {
  return {
    usb,
    bluetooth,
    radioBridge,

    async initialize() {
      await usb.initialize();
      await bluetooth.initialize();
      await radioBridge.initialize();
    },

    getDefaultFlashConnection() {
      return isNativePlatform() ? bluetooth : usb;
    },

    getDataConnection() {
      return ref.current.connection;
    },

    getDataConnectionType() {
      return ref.current.type;
    },

    setDataConnectionListener(
      listener: ((event: ConnectionStatusEvent) => void) | undefined
    ) {
      const oldListener = ref.current.listener;
      if (oldListener) {
        ref.current.connection.removeEventListener("status", oldListener);
      }
      ref.current.listener = listener;
      if (listener) {
        ref.current.connection.addEventListener("status", listener);
      }
    },

    setDataConnectionType(type: DataConnectionType): void {
      if (ref.current.type === type) {
        return;
      }
      ref.current.type = type;
      persistType(type);

      const transport = dataConnectionTypeToTransport(type);
      const listener = ref.current.listener;
      if (listener) {
        ref.current.connection.removeEventListener("status", listener);
      }
      ref.current.connection =
        transport === "bluetooth" ? bluetooth : radioBridge;
      if (listener) {
        ref.current.connection.addEventListener("status", listener);
      }
    },
  };
};

const ConnectionsContext = createContext<Connections | null>(null);

interface ConnectionsProviderProps {
  children: ReactNode;
  usb: MicrobitWebUSBConnection;
  bluetooth: MicrobitWebBluetoothConnection;
  radioBridge: MicrobitRadioBridgeConnection;
}

export const ConnectionsProvider = ({
  children,
  usb,
  bluetooth,
  radioBridge,
}: ConnectionsProviderProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const setDataConnectionType = useStore((s) => s.setDataConnectionType);

  // Read initial value directly from store to avoid subscription.
  const initialType = useStore.getState().dataConnection.type;
  const valueRef = useRef<ConnectionsRefValue>({
    connection:
      dataConnectionTypeToTransport(initialType) === "bluetooth"
        ? bluetooth
        : radioBridge,
    type: initialType,
    listener: undefined,
  });

  // Stable connections object - uses refs for mutable state.
  const connections = useMemo(
    () =>
      createConnections(
        usb,
        bluetooth,
        radioBridge,
        setDataConnectionType,
        valueRef
      ),
    [usb, bluetooth, radioBridge, setDataConnectionType]
  );

  useEffect(() => {
    if (!isInitialized) {
      void connections.initialize().then(() => setIsInitialized(true));
    }
  }, [isInitialized, connections]);

  return (
    <ConnectionsContext.Provider value={connections}>
      {isInitialized ? children : <></>}
    </ConnectionsContext.Provider>
  );
};

/**
 * Returns the Connections object.
 */
export const useConnections = (): Connections => {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error("Missing ConnectionsProvider");
  }
  return context;
};

/**
 * Returns the data connection, re-rendering when the connection type changes.
 *
 * Use this hook when you need reactive updates to connection type changes.
 * For non-reactive access, use `useConnections().getDataConnection()`.
 */
export const useDataConnection = (): DataConnection => {
  const connections = useConnections();
  const dataConnectionType = useStore((s) => s.dataConnection.type);
  const transport = dataConnectionTypeToTransport(dataConnectionType);
  return transport === "bluetooth"
    ? connections.bluetooth
    : connections.radioBridge;
};

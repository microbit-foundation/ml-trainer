/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useConnections } from "../connections-hooks";
import {
  createFireDataConnectionEvent,
  createSendDataConnectionEvent,
  DataConnectionDeps,
  initializeCapabilities,
} from "./data-connection-actions";
import { DataConnectionEvent } from "./data-connection-machine";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import {
  ConnectionStatus,
  ConnectionStatusEvent,
} from "@microbit/microbit-connection";
import { DataConnectionType } from "./data-connection-types";

/**
 * Hook that syncs browser tab visibility with the data connection store.
 * This is used by the flow machine to defer error states while user is away.
 */
const useBrowserTabVisibilitySync = () => {
  const setDataConnection = useStore((s) => s.setDataConnection);

  useEffect(() => {
    const updateVisibility = () => {
      const isVisible = !document.hidden;
      const currentState = useStore.getState().dataConnection;
      if (currentState.isBrowserTabVisible !== isVisible) {
        setDataConnection({
          ...currentState,
          isBrowserTabVisible: isVisible,
        });
      }
    };

    // Set initial visibility
    updateVisibility();

    document.addEventListener("visibilitychange", updateVisibility, false);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [setDataConnection]);
};

type FireDataConnectionEvent = (event: DataConnectionEvent) => void;
type SendDataConnectionEvent = (event: DataConnectionEvent) => Promise<void>;

interface DataConnectionMachine {
  fireEvent: FireDataConnectionEvent;
  sendEvent: SendDataConnectionEvent;
}

const DataConnectionMachineContext =
  createContext<DataConnectionMachine | null>(null);

interface DataConnectionEventProviderProps {
  children: ReactNode;
}

/**
 * Provider that sets up the connection state machine infrastructure.
 * Creates the bound fireEvent function with all required dependencies.
 * Should be placed inside ConnectionsProvider.
 */
export const DataConnectionEventProvider = ({
  children,
}: DataConnectionEventProviderProps) => {
  // Sync browser tab visibility with the store
  useBrowserTabVisibilitySync();

  const connections = useConnections();

  const dataCollectionMicrobitConnected = useStore(
    (s) => s.dataCollectionMicrobitConnected
  );
  const logging = useLogging();

  const deps: DataConnectionDeps = useMemo(
    () => ({
      connections,
      dataCollectionMicrobitConnected,
      logging,
    }),
    [connections, dataCollectionMicrobitConnected, logging]
  );

  const api: DataConnectionMachine = useMemo(() => {
    const fireEvent = createFireDataConnectionEvent(deps);
    const sendEvent = createSendDataConnectionEvent(deps);
    return { fireEvent, sendEvent };
  }, [deps]);

  // Initialize capabilities once on mount
  useEffect(() => {
    void initializeCapabilities(connections);

    connections.setDataConnectionListener((event: ConnectionStatusEvent) => {
      const { status, previousStatus } = event;
      const isUsbConnected =
        connections.usb.status === ConnectionStatus.CONNECTED;
      const type = connections.getDataConnectionType();
      const mappedEvent = mapStatusToEvent(
        status,
        previousStatus,
        isUsbConnected,
        type
      );
      if (mappedEvent) {
        api.fireEvent(mappedEvent);
      }
    });

    return () => {
      connections.setDataConnectionListener(undefined);
    };
  }, [api, connections]);

  return (
    <DataConnectionMachineContext.Provider value={api}>
      {children}
    </DataConnectionMachineContext.Provider>
  );
};

/**
 * Hook to get the event API for the connection state machine.
 *
 * Returns:
 * - `fireEvent`: Fire-and-forget event dispatch with built-in error logging
 * - `sendEvent`: Async event dispatch that returns a promise
 */
export const useDataConnectionMachine = (): DataConnectionMachine => {
  const value = useContext(DataConnectionMachineContext);
  if (!value) {
    throw new Error(
      "useDataConnectionMachine must be used within DataConnectionEventProvider"
    );
  }
  return value;
};

/**
 * Map device status to a state machine event.
 * Some events require checking the previous status to avoid false positives.
 *
 * Note: Connection success (deviceConnected) must be handled via status listener
 * rather than explicit events because the connection library has internal
 * auto-reconnect logic that can succeed independently of performConnectData.
 */
const mapStatusToEvent = (
  status: ConnectionStatus,
  previousStatus: ConnectionStatus,
  isUsbConnected: boolean,
  dataConnectionType: DataConnectionType
): DataConnectionEvent | null => {
  // For radio connections, determine if disconnect is from bridge or remote.
  let disconnectSource: "bridge" | "remote" | undefined;
  if (
    dataConnectionType === DataConnectionType.Radio &&
    status === ConnectionStatus.DISCONNECTED
  ) {
    disconnectSource = isUsbConnected ? "remote" : "bridge";
  }

  switch (status) {
    case ConnectionStatus.CONNECTED:
      return { type: "deviceConnected" };
    case ConnectionStatus.DISCONNECTED:
    case ConnectionStatus.NO_AUTHORIZED_DEVICE:{
      // Both DISCONNECTED and NO_AUTHORIZED_DEVICE mean "not connected".
      // Ignore transitions between these disconnected states (e.g., during
      // clearDevice() which goes DISCONNECTED → NO_AUTHORIZED_DEVICE).
      if (
        previousStatus === ConnectionStatus.DISCONNECTED ||
        previousStatus === ConnectionStatus.NO_AUTHORIZED_DEVICE
      ) {
        return null;
      }
      return { type: "deviceDisconnected", source: disconnectSource };}
    case ConnectionStatus.PAUSED:
      // Connection paused due to tab visibility - will reconnect automatically.
      return { type: "devicePaused" };
    default:
      return null;
  }
};

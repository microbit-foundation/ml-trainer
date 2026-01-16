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
import { useConnectionService } from "../connection-service-hooks";
import {
  createFireDataConnectionEvent,
  createSendDataConnectionEvent,
  DataConnectionDeps,
  initializeCapabilities,
} from "./data-connection-actions";
import { DataConnectionEvent } from "./data-connection-machine";
import { useConnectionConfigStorage } from "../hooks/use-connection-config-storage";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";

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
 * Should be placed inside ConnectProvider and ConnectStatusProvider.
 */
export const DataConnectionEventProvider = ({
  children,
}: DataConnectionEventProviderProps) => {
  // Sync browser tab visibility with the store
  useBrowserTabVisibilitySync();

  const [, setConfig] = useConnectionConfigStorage();
  const connectionService = useConnectionService();

  // Initialize capabilities once on mount
  useEffect(() => {
    void initializeCapabilities(connectionService);
  }, [connectionService]);
  const dataCollectionMicrobitConnected = useStore(
    (s) => s.dataCollectionMicrobitConnected
  );
  const logging = useLogging();

  const deps: DataConnectionDeps = useMemo(
    () => ({
      connectionService,
      dataCollectionMicrobitConnected,
      setConfig,
      logging,
    }),
    [connectionService, dataCollectionMicrobitConnected, setConfig, logging]
  );

  const api: DataConnectionMachine = useMemo(() => {
    const fireEvent = createFireDataConnectionEvent(deps);
    const sendEvent = createSendDataConnectionEvent(deps);
    return { fireEvent, sendEvent };
  }, [deps]);

  // Set up the event callback on ConnectionService
  useEffect(() => {
    connectionService.setEventCallback(api.fireEvent);
  }, [connectionService, api.fireEvent]);

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

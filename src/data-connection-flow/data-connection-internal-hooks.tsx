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

const DataConnectionEventContext =
  createContext<FireDataConnectionEvent | null>(null);
const DataConnectionSendEventContext =
  createContext<SendDataConnectionEvent | null>(null);

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
    initializeCapabilities(connectionService);
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

  const fireEvent = useMemo(() => createFireDataConnectionEvent(deps), [deps]);

  // Set up the event callback on ConnectionService
  useEffect(() => {
    connectionService.setEventCallback(fireEvent);
  }, [connectionService, fireEvent]);

  const sendEvent: SendDataConnectionEvent = useMemo(
    () => createSendDataConnectionEvent(deps),
    [deps]
  );

  return (
    <DataConnectionEventContext.Provider value={fireEvent}>
      <DataConnectionSendEventContext.Provider value={sendEvent}>
        {children}
      </DataConnectionSendEventContext.Provider>
    </DataConnectionEventContext.Provider>
  );
};

/**
 * Hook to get the fire event function for the connection state machine.
 */
export const useFireDataConnectionEvent = (): FireDataConnectionEvent => {
  const fireEvent = useContext(DataConnectionEventContext);
  if (!fireEvent) {
    throw new Error(
      "useFireDataConnectionEvent must be used within DataConnectionEventProvider"
    );
  }
  return fireEvent;
};

/**
 * Hook to get the async send event function for the connection state machine.
 * Use this when you need to await event processing completion.
 */
export const useSendDataConnectionEvent = (): SendDataConnectionEvent => {
  const sendEvent = useContext(DataConnectionSendEventContext);
  if (!sendEvent) {
    throw new Error(
      "useSendDataConnectionEvent must be used within DataConnectionEventProvider"
    );
  }
  return sendEvent;
};

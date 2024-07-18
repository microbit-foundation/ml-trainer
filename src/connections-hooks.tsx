import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { Connections } from "./connections";

export enum ConnectionStatus {
  Disconnected,
  Connected,
}

export interface BluetoothConnection {
  status: ConnectionStatus;
  type: "bluetooth";
}
export interface RadioConnection {
  status: ConnectionStatus;
  type: "radio";
  // Remote micro:bit device id is stored for passing it to bridge micro:bit
  remoteDeviceId: string;
}

export type Connection = BluetoothConnection | RadioConnection;

export enum ProgramType {
  Input,
}

export interface ConnectionsState {
  [ProgramType.Input]?: Connection;
}

type ConnectionsContextValue = [
  ConnectionsState,
  setConnectionsState: (state: ConnectionsState) => void
];

export const ConnectionsContext = createContext<ConnectionsContextValue | null>(
  null
);

interface ConnectionsProviderProps {
  children: ReactNode;
}

export const ConnectionsProvider = ({ children }: ConnectionsProviderProps) => {
  const connectionsContextValue = useState<ConnectionsState>({});
  return (
    <ConnectionsContext.Provider value={connectionsContextValue}>
      {children}
    </ConnectionsContext.Provider>
  );
};

export const useConnections = (): {
  connections: Connections;
  isInputConnected: boolean;
} => {
  const connectionsContextValue = useContext(ConnectionsContext);
  if (!connectionsContextValue) {
    throw new Error("Missing provider");
  }
  const [state, setState] = connectionsContextValue;
  const conn = useMemo(
    () => new Connections(state, setState),
    [state, setState]
  );
  const isInputConnected = useMemo(
    () => conn.isConnected(ProgramType.Input),
    [conn]
  );
  return { connections: conn, isInputConnected };
};

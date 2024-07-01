import { createContext, useContext } from "react";

type ConnectionState =
  | {
      connectionType: "none";
      connectionStatus: "disconnected";
    }
  | {
      connectionType: "bluetooth" | "radio-bridge";
      connectionStatus: "connecting" | "connected" | "disconnected";
    };

interface Connections {
  inputConnection: ConnectionState;
}

type ConnectionsContextValue = Connections;

const initialConnectionsValue: ConnectionsContextValue = {
  inputConnection: { connectionType: "none", connectionStatus: "disconnected" },
};

export const ConnectionsContext = createContext<ConnectionsContextValue>(
  initialConnectionsValue
);

export const useConnections = (): ConnectionsContextValue => {
  const conn = useContext(ConnectionsContext);
  if (!conn) {
    throw new Error("Missing provider");
  }
  return conn;
};

import { ReactNode, createContext, useContext, useReducer } from "react";
import {
  ConnEvent,
  ConnStage,
  ConnState,
  ConnType,
  connectionDialogReducer,
} from "./connection-flow";

type ConnectionFlowContextValue = {
  state: ConnState;
  dispatch: React.Dispatch<ConnEvent>;
};

export const ConnectionFlowContext =
  createContext<ConnectionFlowContextValue | null>(null);

interface ConnectionFlowProviderProps {
  children: ReactNode;
}

export const ConnectionFlowProvider = ({
  children,
}: ConnectionFlowProviderProps) => {
  const isBluetoothSupported = true;
  const [state, dispatch] = useReducer(connectionDialogReducer, {
    // TODO: Check bt and usb compatibility
    type: isBluetoothSupported ? ConnType.Bluetooth : ConnType.RadioRemote,
    stage: ConnStage.None,
    isUsbSupported: true,
  });
  return (
    <ConnectionFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </ConnectionFlowContext.Provider>
  );
};

export const useConnectionFlow = (): ConnectionFlowContextValue => {
  const connFlow = useContext(ConnectionFlowContext);
  if (!connFlow) {
    throw new Error("Missing provider");
  }
  return connFlow;
};

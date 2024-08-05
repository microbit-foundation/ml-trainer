import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { BufferedData } from "./buffered-data";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "./connect-status-hooks";
import { mlSettings } from "./ml";

const BufferedDataContext = createContext<BufferedData | null>(null);

interface ConnectProviderProps {
  children: ReactNode;
}

export const BufferedDataProvider = ({ children }: ConnectProviderProps) => {
  const bufferedData = useBufferedDataInternal();
  return (
    <BufferedDataContext.Provider value={bufferedData}>
      {children}
    </BufferedDataContext.Provider>
  );
};

export const useBufferedData = (): BufferedData => {
  const value = useContext(BufferedDataContext);
  if (!value) {
    throw new Error("Missing provider");
  }
  return value;
};

const useBufferedDataInternal = (): BufferedData => {
  const connectStatus = useConnectStatus();
  const connection = useConnectActions();
  const bufferRef = useRef<BufferedData>();
  const getBuffer = () => {
    if (bufferRef.current) {
      return bufferRef.current;
    }
    bufferRef.current = new BufferedData(mlSettings.numSamples * 2);
    return bufferRef.current;
  };
  useEffect(() => {
    if (connectStatus !== ConnectionStatus.Connected) {
      return;
    }
    const listener = (e: AccelerometerDataEvent) => {
      const { x, y, z } = e.data;
      const sample = {
        x: x / 1000,
        y: y / 1000,
        z: z / 1000,
      };
      getBuffer().addSample(sample, Date.now());
    };
    connection.addAccelerometerListener(listener);
    return () => {
      connection.removeAccelerometerListener(listener);
    };
  }, [connection, connectStatus]);
  return getBuffer();
};

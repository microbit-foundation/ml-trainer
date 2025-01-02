/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MagnetometerDataEvent } from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { BufferedData } from "./buffered-data";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "./connect-status-hooks";
import { useStore } from "./store";
import { processMagnetometerValue } from "./utils/magnetometer";

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
  const [connectStatus] = useConnectStatus();
  const connection = useConnectActions();
  const dataWindow = useStore((s) => s.dataWindow);
  const bufferRef = useRef<BufferedData>();
  const getBuffer = useCallback(() => {
    if (bufferRef.current) {
      return bufferRef.current;
    }
    bufferRef.current = new BufferedData(dataWindow.minSamples * 2);
    return bufferRef.current;
  }, [dataWindow.minSamples]);
  useEffect(() => {
    if (connectStatus !== ConnectionStatus.Connected) {
      return;
    }
    const listener = (e: MagnetometerDataEvent) => {
      const { x, y, z } = e.data;
      const sample = {
        x: processMagnetometerValue(x),
        y: processMagnetometerValue(y),
        z: processMagnetometerValue(z),
      };
      getBuffer().addSample(sample, Date.now());
    };
    connection.addMagnetometerListener(listener);
    return () => {
      connection.removeMagnetometerListener(listener);
    };
  }, [connection, connectStatus, getBuffer]);
  return getBuffer();
};

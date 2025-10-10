/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AccelerometerData,
  AccelerometerDataEvent,
} from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BufferedData } from "./buffered-data";
import { useConnectActions } from "./connect-actions-hooks";
import { ConnectionStatus, useConnectStatus } from "./connect-status-hooks";
import { useStore } from "./store";

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
  }, [connection, connectStatus, getBuffer]);
  return getBuffer();
};

export const useHasMoved = (): boolean => {
  const [hasMoved, setHasMoved] = useState(false);
  const [connectStatus] = useConnectStatus();
  const connection = useConnectActions();
  useEffect(() => {
    if (connectStatus !== ConnectionStatus.Connected) {
      return;
    }
    let ignore = false;
    const movements: AccelerometerData = { x: 0, y: 0, z: 0 };
    const delta = 1000;
    let firstSample: AccelerometerData | undefined;
    const listener = (e: AccelerometerDataEvent) => {
      if (!firstSample) {
        firstSample = e.data;
        console.log(firstSample);
      } else {
        if (Math.abs(firstSample.x - e.data.x) > delta) {
          movements.x = 1;
        }
        if (Math.abs(firstSample.y - e.data.y) > delta) {
          movements.y = 1;
        }
        if (Math.abs(firstSample.z - e.data.z) > delta) {
          movements.z = 1;
        }
      }
      if (movements.x + movements.y + movements.z > 1) {
        connection.removeAccelerometerListener(listener);
        setTimeout(() => {
          if (!ignore) {
            setHasMoved(true);
          }
        }, 5_000);
      }
    };
    if (!hasMoved) {
      connection.addAccelerometerListener(listener);
    }
    return () => {
      ignore = true;
      connection.removeAccelerometerListener(listener);
    };
  }, [connection, connectStatus, hasMoved]);
  return hasMoved;
};

/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerData } from "@microbit/microbit-connection";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { BufferedData } from "./buffered-data";
import { useDataConnection } from "./connections-hooks";
import { useDataConnected } from "./data-connection-flow";
import { useAccelerometerListener } from "./hooks/use-accelerometer-listener";
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
  const dataWindow = useStore((s) => s.dataWindow);
  const bufferRef = useRef<BufferedData>();
  const getBuffer = useCallback(() => {
    if (bufferRef.current) {
      return bufferRef.current;
    }
    bufferRef.current = new BufferedData(dataWindow.minSamples * 2);
    return bufferRef.current;
  }, [dataWindow.minSamples]);

  const accelerometerListener = useCallback(
    (e: AccelerometerData) => {
      const { x, y, z } = e;
      const sample = {
        x: x / 1000,
        y: y / 1000,
        z: z / 1000,
      };
      getBuffer().addSample(sample, Date.now());
    },
    [getBuffer]
  );

  useAccelerometerListener(accelerometerListener);

  return getBuffer();
};

export const useHasMoved = (): boolean => {
  const hasMoved = useStore((s) => s.hasMoved);
  const setHasMoved = useStore((s) => s.setHasMoved);
  const isConnected = useDataConnected();
  const connection = useDataConnection();
  useEffect(() => {
    let ignore = false;
    const delta: AccelerometerData = { x: 0, y: 0, z: 0 };
    let lastSample: AccelerometerData | undefined;
    const threshold = 40_000;
    const minDelta = 100;
    const listener = (e: AccelerometerData) => {
      if (lastSample) {
        const deltaX = Math.abs(lastSample.x - e.x);
        if (deltaX > minDelta) {
          delta.x += deltaX;
        }
        const deltaY = Math.abs(lastSample.y - e.y);
        if (deltaY > minDelta) {
          delta.y += deltaY;
        }
        const deltaZ = Math.abs(lastSample.z - e.z);
        if (deltaZ > minDelta) {
          delta.z += deltaZ;
        }
      }
      lastSample = e;
      if (
        (delta.x > threshold ? 1 : 0) +
          (delta.y > threshold ? 1 : 0) +
          (delta.z > threshold ? 1 : 0) >
        0
      ) {
        connection.removeEventListener("accelerometerdatachanged", listener);
        if (!ignore) {
          setHasMoved(true);
        }
      }
    };
    if (!hasMoved) {
      connection.addEventListener("accelerometerdatachanged", listener);
    }
    return () => {
      ignore = true;
      connection.removeEventListener("accelerometerdatachanged", listener);
    };
  }, [connection, isConnected, hasMoved, setHasMoved]);
  return hasMoved;
};

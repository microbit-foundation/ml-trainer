/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerDataEvent } from "@microbit/microbit-connection";
import { useEffect } from "react";
import { useConnectionService } from "../connection-service-hooks";

type AccelerometerListener = (e: AccelerometerDataEvent) => void;

/**
 * Subscribes to accelerometer data. Callbacks only fire when connected.
 */
export const useAccelerometerListener = (listener: AccelerometerListener) => {
  const connectionService = useConnectionService();

  useEffect(() => {
    connectionService.addAccelerometerListener(listener);
    return () => connectionService.removeAccelerometerListener(listener);
  }, [connectionService, listener]);
};

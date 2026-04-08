/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerData } from "@microbit/microbit-connection";
import { useEffect } from "react";
import { useDataConnection } from "../connections-hooks";

type AccelerometerListener = (e: AccelerometerData) => void;

/**
 * Subscribes to accelerometer data on the active data connection.
 * Callbacks only fire when connected.
 */
export const useAccelerometerListener = (listener: AccelerometerListener) => {
  const connection = useDataConnection();

  useEffect(() => {
    connection.addEventListener("accelerometerdatachanged", listener);
    return () =>
      connection.removeEventListener("accelerometerdatachanged", listener);
  }, [connection, listener]);
};

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion, DeviceError } from "@microbit/microbit-connection";
import { useConnections } from "../connections-hooks";

/**
 * Returns the connected micro:bit's board version, or undefined
 * when no device is connected.
 *
 * For bluetooth connections, reads from the connection object.
 * For radio connections, defaults to V2 because V1 boards are blocked
 * during the connection flow.
 */
export const useBoardVersion = (): BoardVersion | undefined => {
  const connections = useConnections();
  try {
    return connections.bluetooth.getBoardVersion() ?? "V2";
  } catch (e) {
    if (e instanceof DeviceError && e.code === "not-connected") {
      return undefined;
    }
    throw e;
  }
};

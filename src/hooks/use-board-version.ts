/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "@microbit/microbit-connection";
import { useConnections } from "../connections-hooks";

/**
 * Returns the connected micro:bit's board version.
 *
 * For bluetooth connections, reads from the connection object.
 * For radio connections, defaults to V2 because V1 boards are blocked
 * during the connection flow.
 */
export const useBoardVersion = (): BoardVersion => {
  const connections = useConnections();
  return connections.bluetooth.getBoardVersion() ?? "V2";
};

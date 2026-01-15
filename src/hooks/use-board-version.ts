/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "@microbit/microbit-connection";
import { useConnectionService } from "../connection-service-hooks";

/**
 * Returns the connected micro:bit's board version.
 *
 * For bluetooth connections, reads from the connection object.
 * For radio connections, defaults to V2 because V1 boards are blocked
 * during the connection flow.
 */
export const useBoardVersion = (): BoardVersion => {
  const connectionService = useConnectionService();
  return connectionService.getBluetoothBoardVersion() ?? "V2";
};

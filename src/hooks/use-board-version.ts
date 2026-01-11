/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "@microbit/microbit-connection";
import { useConnectionService } from "../connection-service-hooks";
import { useStore } from "../store";

/**
 * Returns the connected micro:bit's board version.
 * For bluetooth connections, reads from the connection object.
 * For radio connections, reads from state machine state.
 */
export const useBoardVersion = (): BoardVersion | undefined => {
  const connectionService = useConnectionService();
  const radioRemoteBoardVersion = useStore(
    (s) => s.dataConnection.radioRemoteBoardVersion
  );
  return (
    connectionService.getBluetoothBoardVersion() ?? radioRemoteBoardVersion
  );
};

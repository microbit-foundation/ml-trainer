/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';

/**
 * A connection to a micro:bit.
 */
interface MicrobitConnection {
  connect(...states: DeviceRequestStates[]): Promise<void>;

  reconnect(): Promise<void>;

  disconnect(userDisconnect: boolean): Promise<void>;
}

export default MicrobitConnection;

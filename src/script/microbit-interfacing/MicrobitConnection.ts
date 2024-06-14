/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { UARTMessageType } from './Microbits';

export enum DeviceRequestStates {
  NONE,
  INPUT,
  OUTPUT,
}

/**
 * A connection to a micro:bit.
 */
interface MicrobitConnection {
  connect(...states: DeviceRequestStates[]): Promise<void>;

  reconnect(finalAttempt: boolean): Promise<void>;

  disconnect(): Promise<void>;

  getLogData(): Promise<void>;

  sendToInputUart(type: UARTMessageType, value: string): void;
}

export default MicrobitConnection;

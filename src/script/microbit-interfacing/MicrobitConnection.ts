/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { PersistantGestureData } from '../domain/Gestures';
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

  getLogData(): Promise<PersistantGestureData[]>;

  sendToInputUart(type: UARTMessageType, value: string): void;
}

export default MicrobitConnection;

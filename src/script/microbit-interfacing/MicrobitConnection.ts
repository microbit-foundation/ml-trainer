/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { CortexM, DAPLink, WebUSB } from 'dapjs';
import MBSpecs from './MBSpecs';

const baudRate = 115200;
const serialDelay = 5;

/**
 * A USB connection to a micro:bit.
 */
interface MicrobitConnection {
  listenToInputServices(): Promise<void>;
  disconnectInputServices(): Promise<void>;
}

export default MicrobitConnection;

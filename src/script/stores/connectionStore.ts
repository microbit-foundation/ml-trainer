/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, type Writable } from 'svelte/store';
import { persistantWritable } from './storeUtil';
import MBSpecs from '../microbit-interfacing/MBSpecs';
// Todo: Rename file to a more appropriate name
// Pattern for connecting to input microbit
export const btPatternInput: Writable<boolean[]> = persistantWritable<boolean[]>(
  'btPatternInput',
  Array<boolean>(25).fill(false),
);

// Pattern for connecting to output microbit
export const btPatternOutput: Writable<boolean[]> = persistantWritable<boolean[]>(
  'btPatternOutput',
  Array<boolean>(25).fill(false),
);

export const webUsbMicrobitName: Writable<string> = persistantWritable<string>(
  'webUsbMicrobitName',
  '',
);

export type ConnectionType = 'WebUSB' | 'WebBluetooth' | 'None';
export const previousConnection: Writable<ConnectionType> =
  persistantWritable<ConnectionType>('previousConnection', 'None');

export const isInputPatternValid = () => {
  const pattern = get(btPatternInput);
  return MBSpecs.Utility.isPairingPattermValid(pattern);
};

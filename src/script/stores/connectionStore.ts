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
export const btPatternInput = persistantWritable<boolean[]>(
  'btPatternInput',
  Array<boolean>(25).fill(false),
);

// Pattern for connecting to output microbit
export const btPatternOutput = persistantWritable<boolean[]>(
  'btPatternOutput',
  Array<boolean>(25).fill(false),
);

export const radioBridgeFrequency = persistantWritable<number>(
  'radioBridgeFrequency',
  -1,
);

export const isInputPatternValid = () => {
  const pattern = get(btPatternInput);
  return MBSpecs.Utility.isPairingPattermValid(pattern);
};

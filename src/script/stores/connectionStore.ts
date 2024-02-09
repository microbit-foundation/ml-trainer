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

export const radioBridgeRemoteDeviceId = persistantWritable<number>(
  'radioBridgeRemoteDeviceId',
  -1,
);

// Show the select micro:bit dialog for Bluetooth pairing on page load.
// The previous attempt to requestDevice failed.
export const btSelectMicrobitDialogOnLoad = persistantWritable<boolean>(
  'btSelectMicrobitDialogOnLoad',
  false,
);

export const isInputPatternValid = () => {
  const pattern = get(btPatternInput);
  return MBSpecs.Utility.isPairingPattermValid(pattern);
};

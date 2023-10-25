/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, writable } from 'svelte/store';
import { state } from './uiStore';

export enum DeviceRequestStates {
  NONE,
  INPUT,
  OUTPUT,
}
export enum ConnectDialogStates {
  NONE, // No connection in progress -> Dialog box closed
  START, // Initial box with choice between usb installation and bluetooth connection
  START_OUTPUT, // Initial box if input microbit is already connected. Choice between same and other microbit for output
  BLUETOOTH, // Main bluetooth connect prompt, with pattern drawing
  USB_START, // Initial usb installation prompt
  USB_DOWNLOADING, // Downloading usb program status bar prompt
  USB_DONE, // Installation done prompt
  SERIAL_START,
  MANUAL_TUTORIAL, // Prompt with tutorial gif for manual installation (and downloading of program)
  BAD_FIRMWARE, // We detected an issue with the firmware of the micro:bit trying to transfer program.
}

export const connectionDialogState = writable<{
  connectionState: ConnectDialogStates;
  deviceState: DeviceRequestStates;
}>({
  connectionState: ConnectDialogStates.NONE,
  deviceState: DeviceRequestStates.NONE,
});

export const startConnectionProcess = (): void => {
  connectionDialogState.update(s => {
    s.connectionState = get(state).isInputConnected
      ? ConnectDialogStates.START_OUTPUT
      : ConnectDialogStates.START;
    s.deviceState = get(state).isInputConnected
      ? DeviceRequestStates.OUTPUT
      : DeviceRequestStates.INPUT;
    return s;
  });
};

export const startSerialConnection = (): void => {
  connectionDialogState.update(s => {
    s.connectionState = ConnectDialogStates.SERIAL_START;
    s.deviceState = get(state).isInputConnected
      ? DeviceRequestStates.OUTPUT
      : DeviceRequestStates.INPUT;
    return s;
  });
};

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
  START, // Initial box with choice between radio and bluetooth connection
  START_OUTPUT, // Initial box if input microbit is already connected. Choice between same and other microbit for output
  BAD_FIRMWARE, // We detected an issue with the firmware of the micro:bit trying to transfer program.
  CONNECT_CABLE, // Instructions how to connect micro:bit via usb
  CONNECT_TUTORIAL, // Instructions how to select micro:bit on popup
  USB_DOWNLOADING, // Downloading usb program status bar prompt
  CONNECT_BATTERY, // Instructions to connect micro:bit to battery
  BLUETOOTH, // Bluetooth connect prompt, with pattern drawing
  BLUETOOTH_CONNECTING, // Downloading BlueTooth prompt
  USB_START, // Initial usb installation prompt
  USB_DONE, // Installation done prompt
  MANUAL_TUTORIAL, // Prompt with tutorial gif for manual installation (and downloading of program)
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

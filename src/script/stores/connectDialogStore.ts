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
  START_RADIO, // Initial box. Main prompt is to connect via radio however includes choice to connect via bluetooth
  CONNECTING_MICROBITS, // Micro:bits connecting prompt
  START_BLUETOOTH, // Initial box to begin the bluetooth connection flow
  START_OUTPUT, // Initial box if input microbit is already connected. Choice between same and other microbit for output
  BAD_FIRMWARE, // We detected an issue with the firmware of the micro:bit trying to transfer program.
  WEARING_SETUP, // Contains the instructions on how to attatch the strap to the micro:bit.
  CONNECT_CABLE, // Instructions how to connect micro:bit via usb
  CONNECT_TUTORIAL_USB, // Instructions how to select micro:bit on popup when connected by usb
  USB_DOWNLOADING, // Downloading usb program status bar prompt
  CONNECT_BATTERY, // Instructions to connect micro:bit to battery
  BLUETOOTH, // Bluetooth connect prompt, with pattern drawing
  CONNECT_TUTORIAL_BLUETOOTH, // Instructions on how to connect micro:bit when connecting to bluetooth
  BLUETOOTH_CONNECTING, // Downloading BlueTooth prompt
  CONNECT_TUTORIAL_SERIAL, // Instructions how to connect the micro:bit using a serial connection
  USB_START, // Initial usb installation prompt
  USB_DONE, // Installation done prompt
  MANUAL_TUTORIAL, // Prompt with tutorial gif for manual installation (and downloading of program)
  USB_TRY_AGAIN, // Prompt user to try connecting via WebUSB again
}

export const connectionDialogState = writable<{
  connectionState: ConnectDialogStates;
  deviceState: DeviceRequestStates;
}>({
  connectionState: ConnectDialogStates.NONE,
  deviceState: DeviceRequestStates.NONE,
});

export const startConnectionProcess = (): void => {
  // Updating the state will cause a popup to appear, from where the connection process will take place
  connectionDialogState.update(s => {
    s.connectionState = get(state).isInputConnected
      ? ConnectDialogStates.START_OUTPUT
      : ConnectDialogStates.START_RADIO;
    s.deviceState = get(state).isInputConnected
      ? DeviceRequestStates.OUTPUT
      : DeviceRequestStates.INPUT;
    return s;
  });
};

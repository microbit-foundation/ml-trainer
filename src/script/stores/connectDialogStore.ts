/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, writable } from 'svelte/store';
import { compatibility, state } from './uiStore';

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
  MANUAL_TUTORIAL, // Prompt with tutorial gif for manual installation (and downloading of program)
  USB_TRY_AGAIN, // Prompt user to try connecting via WebUSB again
}

export enum ConnectionStates {
  WHAT_YOU_WILL_NEED_1_MICROBIT = 'WHAT_YOU_WILL_NEED_1_MICROBIT',
  WHAT_YOU_WILL_NEED_2_MICROBITS = 'WHAT_YOU_WILL_NEED_2_MICROBITS',
  SETUP_1_MICROBIT = 'SETUP_1_MICROBIT',
  SETUP_2_MICROBITS = 'SETUP_2_MICROBITS',
  CONNECT_CABLE_USB = 'CONNECT_CABLE_USB',
  CONNECT_CABLE_USB_RADIO_SENDER = 'CONNECT_CABLE_USB_RADIO_SENDER',
  CONNECT_CABLE_USB_RADIO_RECEIVER = 'CONNECT_CABLE_USB_RADIO_RECEIVER',
  SELECT_MICROBIT = 'SELECT_MICROBIT',
  SELECT_MICROBIT_FOR_RADIO_SENDER = 'SELECT_MICROBIT_FOR_RADIO_SENDER',
  SELECT_MICROBIT_FOR_RADIO_RECEIVER = 'SELECT_MICROBIT_FOR_RADIO_RECEIVER',
  MANUAL_TRANSFER_OF_HEX = 'MANUAL_TRANSFER_OF_HEX',
  WEB_USB_TRY_AGAIN_FOR_RADIO_SENDER = 'WEB_USB_TRY_AGAIN_FOR_RADIO_SENDER',
  WEB_USB_TRY_AGAIN_FOR_RADIO_RECEIVER = 'WEB_USB_TRY_AGAIN_FOR_RADIO_RECEIVER',
  DOWNLOADING_FOR_MICROBIT_BLUETOOTH = 'DOWNLOADING_FOR_MICROBIT_BLUETOOTH',
  DOWNLOADING_FOR_MICROBIT_RADIO_SENDER = 'DOWNLOADING_FOR_MICROBIT_RADIO_SENDER',
  DOWNLOADING_FOR_MICROBIT_RADIO_RECEIVER = 'DOWNLOADING_FOR_MICROBIT_RADIO_RECEIVER',
  BATTERY_PACK_FOR_MICROBIT_RADIO_SENDER = 'BATTERY_PACK_FOR_MICROBIT_RADIO_SENDER',
  BATTERY_PACK_FOR_MICROBIT_BLUETOOTH = 'BATTERY_PACK_FOR_MICROBIT_BLUETOOTH',
  BLUETOOTH_COPY_PATTERN = 'BLUETOOTH_COPY_PATTERN',
  SELECT_MICROBIT_FOR_BLUETOOTH = 'SELECT_MICROBIT_FOR_BLUETOOTH',
  CONNECTING_BLUETOOTH = 'CONNECTING_BLUETOOTH',
  CONNECTING_MICROBITS = 'CONNECTING_MICROBITS',
  BLUETOOTH_TRY_AGAIN = 'BLUETOOTH_TRY_AGAIN',
  CONNECTION_UNFINISHED = 'CONNECTION_UNFINISHED',
  CONNECTION_SUCCESS = 'CONNECTION_SUCCESS',
}

const radioMicrobitConnectionStates = {
  [ConnectionStates.WHAT_YOU_WILL_NEED_2_MICROBITS]: {
    on: {
      next: ConnectionStates.SETUP_2_MICROBITS,
      switch: ConnectionStates.WHAT_YOU_WILL_NEED_1_MICROBIT,
    },
  },
  [ConnectionStates.SETUP_2_MICROBITS]: {
    on: {
      back: ConnectionStates.WHAT_YOU_WILL_NEED_2_MICROBITS,
      next: ConnectionStates.CONNECT_CABLE_USB_RADIO_SENDER,
    },
  },
  [ConnectionStates.CONNECT_CABLE_USB_RADIO_SENDER]: {
    on: {
      back: ConnectionStates.SETUP_2_MICROBITS,
      next: ConnectionStates.SELECT_MICROBIT_FOR_RADIO_SENDER,
    },
  },
  [ConnectionStates.SELECT_MICROBIT_FOR_RADIO_SENDER]: {
    on: {
      success: ConnectionStates.DOWNLOADING_FOR_MICROBIT_RADIO_SENDER,
      failure: ConnectionStates.WEB_USB_TRY_AGAIN_FOR_RADIO_SENDER,
    },
  },
  [ConnectionStates.DOWNLOADING_FOR_MICROBIT_RADIO_SENDER]: {
    on: {
      success: ConnectionStates.BATTERY_PACK_FOR_MICROBIT_RADIO_SENDER,
    },
  },
  [ConnectionStates.WEB_USB_TRY_AGAIN_FOR_RADIO_SENDER]: {
    on: {
      next: ConnectionStates.SELECT_MICROBIT_FOR_RADIO_SENDER,
      cancel: ConnectionStates.CONNECTION_UNFINISHED,
    },
  },
  [ConnectionStates.BATTERY_PACK_FOR_MICROBIT_RADIO_SENDER]: {
    on: {
      back: ConnectionStates.SELECT_MICROBIT_FOR_RADIO_SENDER,
      next: ConnectionStates.CONNECT_CABLE_USB_RADIO_RECEIVER,
    },
  },
  [ConnectionStates.CONNECT_CABLE_USB_RADIO_RECEIVER]: {
    on: {
      back: ConnectionStates.BATTERY_PACK_FOR_MICROBIT_RADIO_SENDER,
      next: ConnectionStates.SELECT_MICROBIT_FOR_RADIO_RECEIVER,
    },
  },
  [ConnectionStates.SELECT_MICROBIT_FOR_RADIO_RECEIVER]: {
    on: {
      success: ConnectionStates.DOWNLOADING_FOR_MICROBIT_RADIO_RECEIVER,
      failure: ConnectionStates.WEB_USB_TRY_AGAIN_FOR_RADIO_RECEIVER,
    },
  },
  [ConnectionStates.DOWNLOADING_FOR_MICROBIT_RADIO_RECEIVER]: {
    on: {
      success: ConnectionStates.CONNECTING_MICROBITS,
    },
  },
  [ConnectionStates.WEB_USB_TRY_AGAIN_FOR_RADIO_RECEIVER]: {
    on: {
      next: ConnectionStates.SELECT_MICROBIT_FOR_RADIO_RECEIVER,
      cancel: ConnectionStates.CONNECTION_UNFINISHED,
    },
  },
  [ConnectionStates.CONNECTING_MICROBITS]: {
    on: {
      success: ConnectionStates.CONNECTION_SUCCESS,
      failure: ConnectionStates.CONNECTION_UNFINISHED,
    },
  },
};

const bluetoothMicrobitConnectionStates = {
  [ConnectionStates.WHAT_YOU_WILL_NEED_1_MICROBIT]: {
    on: {
      next: ConnectionStates.SETUP_1_MICROBIT,
      switch: ConnectionStates.WHAT_YOU_WILL_NEED_2_MICROBITS,
    },
  },
  [ConnectionStates.SETUP_1_MICROBIT]: {
    on: {
      back: ConnectionStates.WHAT_YOU_WILL_NEED_1_MICROBIT,
      next: ConnectionStates.CONNECT_CABLE_USB,
    },
  },
  [ConnectionStates.CONNECT_CABLE_USB]: {
    on: {
      back: ConnectionStates.SETUP_1_MICROBIT,
      next: ConnectionStates.SELECT_MICROBIT,
      skip: ConnectionStates.BATTERY_PACK_FOR_MICROBIT_BLUETOOTH,
    },
  },
  [ConnectionStates.SELECT_MICROBIT]: {
    on: {
      success: ConnectionStates.DOWNLOADING_FOR_MICROBIT_BLUETOOTH,
      failure: ConnectionStates.MANUAL_TRANSFER_OF_HEX,
    },
  },
  [ConnectionStates.MANUAL_TRANSFER_OF_HEX]: {
    on: {
      back: ConnectionStates.SELECT_MICROBIT,
      next: ConnectionStates.BATTERY_PACK_FOR_MICROBIT_BLUETOOTH,
    },
  },
  [ConnectionStates.DOWNLOADING_FOR_MICROBIT_BLUETOOTH]: {
    on: {
      success: ConnectionStates.BATTERY_PACK_FOR_MICROBIT_BLUETOOTH,
    },
  },
  [ConnectionStates.BATTERY_PACK_FOR_MICROBIT_BLUETOOTH]: {
    on: {
      back: ConnectionStates.SELECT_MICROBIT,
      next: ConnectionStates.BLUETOOTH_COPY_PATTERN,
    },
  },
  [ConnectionStates.BLUETOOTH_COPY_PATTERN]: {
    on: {
      back: ConnectionStates.CONNECTION_UNFINISHED,
      next: ConnectionStates.SELECT_MICROBIT_FOR_BLUETOOTH,
    },
  },
  [ConnectionStates.SELECT_MICROBIT_FOR_BLUETOOTH]: {
    on: {
      back: ConnectionStates.CONNECTING_BLUETOOTH,
      next: ConnectionStates.SELECT_MICROBIT_FOR_BLUETOOTH,
    },
  },
  [ConnectionStates.CONNECTING_BLUETOOTH]: {
    on: {
      failure: ConnectionStates.BLUETOOTH_TRY_AGAIN,
      success: ConnectionStates.CONNECTION_SUCCESS,
    },
  },
  [ConnectionStates.BLUETOOTH_TRY_AGAIN]: {
    on: {
      next: ConnectionStates.BLUETOOTH_COPY_PATTERN,
      cancel: ConnectionStates.CONNECTION_UNFINISHED,
    },
  },
};

type ConnectionStateMachine = {
  [key in ConnectionStates]: {
    on?: {
      switch?: ConnectionStates;
      back?: ConnectionStates;
      next?: ConnectionStates;
      success?: ConnectionStates;
      failure?: ConnectionStates;
      skip?: ConnectionStates;
    };
  };
};

export const connectionStateMachine: ConnectionStateMachine = {
  ...radioMicrobitConnectionStates,
  ...bluetoothMicrobitConnectionStates,
  [ConnectionStates.CONNECTION_UNFINISHED]: {},
  [ConnectionStates.CONNECTION_SUCCESS]: {},
};

export const connectionDialogState = writable<{
  connectionState: ConnectDialogStates;
  deviceState: DeviceRequestStates;
}>({
  connectionState: ConnectDialogStates.NONE,
  deviceState: DeviceRequestStates.NONE,
});

export const startConnectionProcess = (): void => {
  const { usb } = get(compatibility);
  // Updating the state will cause a popup to appear, from where the connection process will take place
  connectionDialogState.update(s => {
    s.connectionState = get(state).isInputConnected
      ? ConnectDialogStates.START_OUTPUT
      : usb
        ? ConnectDialogStates.START_RADIO
        : ConnectDialogStates.START_BLUETOOTH;
    s.deviceState = get(state).isInputConnected
      ? DeviceRequestStates.OUTPUT
      : DeviceRequestStates.INPUT;
    return s;
  });
};

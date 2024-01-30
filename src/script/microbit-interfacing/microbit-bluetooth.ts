/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { get, writable } from 'svelte/store';
import StaticConfiguration from '../../StaticConfiguration';
import { isDevMode } from '../environment';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import { outputting, state } from '../stores/uiStore';
import MBSpecs from './MBSpecs';
import { UARTMessageType } from './Microbits';
import {
  onAccelerometerChange,
  onButtonChange,
  onUARTDataReceived,
} from './change-listeners';
import {
  stateOnAssigned,
  stateOnConnected,
  stateOnDisconnected,
  stateOnFailedToConnect,
  stateOnReady,
} from './state-updaters';

export class MicrobitBluetooth {
  constructor(
    public readonly name: string,
    public readonly device: BluetoothDevice,
  ) {}
}

/**
 * UART data target. For fixing type compatibility issues.
 */
export type CharacteristicDataTarget = EventTarget & {
  value: DataView;
};

type QueueElement = {
  service: BluetoothRemoteGATTCharacteristic;
  view: DataView;
};

type BluetoothConnectionResult =
  | {
      result: MicrobitBluetooth;
      success: true;
    }
  | { success: false };

const disconnectListeners: Record<
  DeviceRequestStates,
  (() => Promise<void>) | undefined
> = {
  [DeviceRequestStates.NONE]: undefined,
  [DeviceRequestStates.INPUT]: undefined,
  [DeviceRequestStates.OUTPUT]: undefined,
};

let bluetoothServiceActionQueue = writable<{
  busy: boolean;
  queue: QueueElement[];
}>({
  busy: false,
  queue: [],
});

export const startBluetoothConnection = async (
  name: string,
  requestState: DeviceRequestStates,
  existingDevice: BluetoothDevice | undefined,
): Promise<BluetoothConnectionResult> => {
  let device: BluetoothDevice | undefined;
  if (!existingDevice) {
    device = await requestBluetoothDevice(name);
    if (!device) {
      stateOnFailedToConnect(requestState);
      return {
        success: false,
      };
    }
  } else {
    device = existingDevice;
  }

  const disconnectListener = createDisconnectListener(device, requestState);
  disconnectListeners[requestState] = disconnectListener;
  device.addEventListener('gattserverdisconnected', disconnectListener);
  try {
    const { gattServer, microbitVersion } = await connectBluetoothDevice(
      device,
      requestState,
    );

    if (requestState === DeviceRequestStates.INPUT) {
      await listenToInputServices(gattServer);
    } else {
      await listenToOutputServices(gattServer);
    }
    stateOnAssigned(requestState, microbitVersion);
    stateOnReady(requestState);
  } catch (e) {
    device.removeEventListener('gattserverdisconnected', disconnectListener);
    stateOnFailedToConnect(requestState);
    return {
      success: false,
    };
  }
  return {
    success: true,
    result: new MicrobitBluetooth(name, device),
  };
};

const requestBluetoothDevice = async (
  name: string,
): Promise<BluetoothDevice | undefined> => {
  try {
    return navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: `BBC micro:bit [${name}]` }],
      optionalServices: [
        MBSpecs.Services.UART_SERVICE,
        MBSpecs.Services.ACCEL_SERVICE,
        MBSpecs.Services.DEVICE_INFO_SERVICE,
        MBSpecs.Services.LED_SERVICE,
        MBSpecs.Services.IO_SERVICE,
        MBSpecs.Services.BUTTON_SERVICE,
      ],
    });
  } catch (e) {
    isDevMode && console.error('Error logging:', e);
  }
};

interface ConnectBluetoothDeviceReturn {
  gattServer: BluetoothRemoteGATTServer;
  microbitVersion: MBSpecs.MBVersion;
}

const connectBluetoothDevice = async (
  device: BluetoothDevice,
  requestState: DeviceRequestStates,
): Promise<ConnectBluetoothDeviceReturn> => {
  if (device.gatt === undefined) {
    console.warn('Missing gatt server on microbit device:', device);
    throw new Error('BluetoothRemoteGATTServer for microbit device is undefined');
  }
  try {
    const gattServer = await device.gatt.connect();
    const microbitVersion = await MBSpecs.Utility.getModelNumber(gattServer);
    stateOnConnected(requestState);
    return {
      gattServer,
      microbitVersion,
    };
  } catch (e) {
    if (device.gatt !== undefined) {
      // In case bluetooth was connected but some other error occurs.
      // Disconnect bluetooth to keep consistent state.
      device.gatt.disconnect();
    }
    throw new Error('Failed to establish a connection!');
  }
};

export const disconnectBluetoothDevice = (
  device: BluetoothDevice,
  requestState: DeviceRequestStates,
  userDisconnect: boolean,
) => {
  stateOnDisconnected(requestState, userDisconnect);
  const disconnectListener = disconnectListeners[requestState];
  if (disconnectListener) {
    device.removeEventListener('gattserverdisconnected', disconnectListener);
    disconnectListeners[requestState] = undefined;
  }
  device.gatt?.disconnect();
  clearBluetoothServiceActionQueue();
  clearOutputFunctions();
};

const createDisconnectListener = (
  device: BluetoothDevice,
  requestState: DeviceRequestStates,
) => {
  return () => disconnectListener(device, requestState);
};

const attemptReconnect = async (
  device: BluetoothDevice,
  requestState: DeviceRequestStates,
): Promise<void> => {
  if (device.gatt) {
    const { gattServer, microbitVersion } = await connectBluetoothDevice(
      device,
      requestState,
    );
    if (requestState === DeviceRequestStates.INPUT) {
      await listenToInputServices(gattServer);
    }
    stateOnAssigned(requestState, microbitVersion);
    stateOnReady(requestState);
  } else {
    throw new Error('No gatt server found!');
  }
};

const disconnectListener = async (
  device: BluetoothDevice,
  requestState: DeviceRequestStates,
): Promise<void> => {
  try {
    await attemptReconnect(device, requestState);
  } catch (e) {
    isDevMode && console.error('Error logging:', e);
    disconnectBluetoothDevice(device, requestState, false);
  }
};

const listenToInputServices = async (
  gattServer: BluetoothRemoteGATTServer,
): Promise<void> => {
  if (!gattServer.connected) {
    throw new Error('Could not listen to services, no microbit connected!');
  }
  try {
    await listenToAccelerometer(gattServer, onAccelerometerChange);
    await listenToButton(gattServer, 'A', onButtonChange);
    await listenToButton(gattServer, 'B', onButtonChange);
    await listenToUART(gattServer, data =>
      onUARTDataReceived(DeviceRequestStates.INPUT, data),
    );
  } catch (e) {
    isDevMode && console.error('Error logging:', e);
  }
};

const listenToButton = async (
  gattServer: BluetoothRemoteGATTServer,
  buttonToListenFor: MBSpecs.Button,
  onButtonChanged: (state: MBSpecs.ButtonState, button: MBSpecs.Button) => void,
): Promise<void> => {
  const buttonService = await gattServer.getPrimaryService(
    MBSpecs.Services.BUTTON_SERVICE,
  );

  // Select the correct characteristic to listen to.
  const UUID =
    buttonToListenFor === 'A'
      ? MBSpecs.Characteristics.BUTTON_A
      : MBSpecs.Characteristics.BUTTON_B;
  const buttonCharacteristic = await buttonService.getCharacteristic(UUID);

  await buttonCharacteristic.startNotifications();

  buttonCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
    const target = event.target as CharacteristicDataTarget;
    const stateId = target.value.getUint8(0);
    let state = MBSpecs.ButtonStates.Released;
    if (stateId === 1) {
      state = MBSpecs.ButtonStates.Pressed;
    }
    if (stateId === 2) {
      state = MBSpecs.ButtonStates.LongPressed;
    }
    onButtonChanged(state, buttonToListenFor);
  });
};

const listenToAccelerometer = async (
  gattServer: BluetoothRemoteGATTServer,
  onAccelerometerChanged: (x: number, y: number, z: number) => void,
): Promise<void> => {
  const accelerometerService = await gattServer.getPrimaryService(
    MBSpecs.Services.ACCEL_SERVICE,
  );
  const accelerometerCharacteristic = await accelerometerService.getCharacteristic(
    MBSpecs.Characteristics.ACCEL_DATA,
  );
  await accelerometerCharacteristic.startNotifications();
  accelerometerCharacteristic.addEventListener(
    'characteristicvaluechanged',
    (event: Event) => {
      const target = event.target as CharacteristicDataTarget;
      const x = target.value.getInt16(0, true);
      const y = target.value.getInt16(2, true);
      const z = target.value.getInt16(4, true);
      onAccelerometerChanged(x, y, z);
    },
  );
};

const listenToUART = async (
  gattServer: BluetoothRemoteGATTServer,
  onDataReceived: (data: string) => void,
): Promise<void> => {
  const uartService = await gattServer.getPrimaryService(MBSpecs.Services.UART_SERVICE);
  const uartTXCharacteristic = await uartService.getCharacteristic(
    MBSpecs.Characteristics.UART_DATA_TX,
  );

  await uartTXCharacteristic.startNotifications();

  uartTXCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
    // Convert the data to a string.
    const receivedData: number[] = [];
    const target = event.target as CharacteristicDataTarget;
    for (let i = 0; i < target.value.byteLength; i += 1) {
      receivedData[i] = target.value.getUint8(i);
    }
    const receivedString = String.fromCharCode.apply(null, receivedData);
    onDataReceived(receivedString);
  });
};

const outputNotReady = (resetPins: boolean = false) => {
  // Reset pins being called before output ready previous bug from existing code.
  if (!resetPins) {
    isDevMode &&
      console.error('Attempted to access output device services without output ready');
  }
  return;
};

interface SendToOutput {
  sendToOutputUart: (() => void) | ((type: UARTMessageType, value: string) => void);
  setOutputMatrix: (() => void) | ((matrix: boolean[]) => void);
  sendToOutputPin:
    | (() => void)
    | ((data: { pin: MBSpecs.UsableIOPin; on: boolean }[]) => void);
  resetIOPins: () => void;
}

export const sendToOutput: SendToOutput = {
  sendToOutputUart: outputNotReady,
  setOutputMatrix: outputNotReady,
  sendToOutputPin: outputNotReady,
  resetIOPins: () => outputNotReady(true),
};

const listenToOutputServices = async (
  gattServer: BluetoothRemoteGATTServer,
): Promise<void> => {
  if (!gattServer.connected) {
    throw new Error('Could not listen to services, no microbit connected!');
  }
  const ioService = await gattServer.getPrimaryService(MBSpecs.Services.IO_SERVICE);
  const outputIO = await ioService.getCharacteristic(MBSpecs.Characteristics.IO_DATA);
  const ledService = await gattServer.getPrimaryService(MBSpecs.Services.IO_SERVICE);
  const outputMatrix = await ledService.getCharacteristic(
    MBSpecs.Characteristics.LED_MATRIX_STATE,
  );
  const uartService = await gattServer.getPrimaryService(MBSpecs.Services.UART_SERVICE);
  const outputUart = await uartService.getCharacteristic(
    MBSpecs.Characteristics.UART_DATA_RX,
  );

  sendToOutput['sendToOutputPin'] = (data: { pin: MBSpecs.UsableIOPin; on: boolean }[]) =>
    sendToOutputPin(outputIO, data);
  sendToOutput['resetIOPins'] = () => resetIOPins(outputIO);
  sendToOutput['setOutputMatrix'] = (matrix: boolean[]) =>
    setOutputMatrix(outputMatrix, matrix);
  sendToOutput['sendToOutputUart'] = (type: UARTMessageType, value: string) =>
    sendToOutputUart(outputUart, type, value);

  try {
    await listenToUART(gattServer, data =>
      onUARTDataReceived(DeviceRequestStates.OUTPUT, data),
    );
  } catch (e) {
    isDevMode && console.error('Error logging:', e);
  }
};

const clearOutputFunctions = () => {
  sendToOutput['sendToOutputUart'] = outputNotReady;
  sendToOutput['setOutputMatrix'] = outputNotReady;
  sendToOutput['sendToOutputPin'] = outputNotReady;
  sendToOutput['resetIOPins'] = () => outputNotReady(true);
};

const sendIOPinMessage = (
  outputIO: BluetoothRemoteGATTCharacteristic,
  data: { pin: MBSpecs.UsableIOPin; on: boolean },
): void => {
  const dataView = new DataView(new ArrayBuffer(2));
  dataView.setInt8(0, data.pin);
  dataView.setInt8(1, data.on ? 1 : 0);
  outputting.set({ text: `Turn pin ${data.pin} ${data.on ? 'on' : 'off'}` });
  addToServiceActionQueue(outputIO, dataView);
};

const sendToOutputPin = (
  outputIO: BluetoothRemoteGATTCharacteristic,
  data: { pin: MBSpecs.UsableIOPin; on: boolean }[],
): void => {
  const ioPinMessages = new Map<MBSpecs.UsableIOPin, number>();
  for (const msg of data) {
    // Initialise
    ioPinMessages.set(msg.pin, 0);
    const currentPinValue: number = ioPinMessages.get(msg.pin)!;
    const deltaValue = msg.on ? 1 : -1;
    ioPinMessages.set(msg.pin, Math.max(0, currentPinValue + deltaValue));
  }
  for (const [key, value] of ioPinMessages) {
    sendIOPinMessage(outputIO, { pin: key, on: value !== 0 });
  }
};

const resetIOPins = (outputIO: BluetoothRemoteGATTCharacteristic) => {
  StaticConfiguration.supportedPins.forEach(value => {
    sendIOPinMessage(outputIO, { pin: value, on: false });
  });
};

const subarray = <T>(arr: T[], start: number, end: number): T[] => {
  const newArr: T[] = [];
  for (let i = start; i < end; i++) {
    newArr.push(arr[i]);
  }
  return newArr;
};

const setOutputMatrix = (
  outputMatrix: BluetoothRemoteGATTCharacteristic,
  matrix: boolean[],
): void => {
  const dataView = new DataView(new ArrayBuffer(5));
  for (let i = 0; i < 5; i++) {
    dataView.setUint8(
      i,
      subarray(matrix, i * 5, 5 + i * 5).reduce(
        (byte, bool) => (byte << 1) | (bool ? 1 : 0),
        0,
      ),
    );
  }
  addToServiceActionQueue(outputMatrix, dataView);
};

/**
 * Sends a message through UART
 * @param type The type of UART message, i.e 'g' for gesture and 's' for sound
 * @param value The message
 */
const sendToOutputUart = (
  outputUart: BluetoothRemoteGATTCharacteristic,
  type: UARTMessageType,
  value: string,
): void => {
  const view = MBSpecs.Utility.messageToDataview(`${type}_${value}`);
  addToServiceActionQueue(outputUart, view);
};

const addToServiceActionQueue = (
  service: BluetoothRemoteGATTCharacteristic,
  view: DataView,
) => {
  bluetoothServiceActionQueue.update(update => {
    update.queue.push({ service, view });
    return update;
  });
  processServiceActionQueue();
};

const processServiceActionQueue = () => {
  if (
    get(bluetoothServiceActionQueue).busy ||
    get(bluetoothServiceActionQueue).queue.length == 0
  )
    return;
  get(bluetoothServiceActionQueue).busy = true;
  const { service, view } = get(bluetoothServiceActionQueue).queue.shift() ?? {
    service: undefined,
    view: undefined,
  };
  if (service === undefined) {
    throw new Error(
      'Could not process the service queue, an element in the queue was not provided with a service to execute on.',
    );
  }

  service
    .writeValue(view)
    .then(() => {
      get(bluetoothServiceActionQueue).busy = false;
      processServiceActionQueue();
    })
    .catch(err => {
      // Catches a characteristic not found error, preventing further output.
      // Why does this happens is not clear
      console.error(err);
      if (err) {
        if ((err as DOMException).message.includes('GATT Service no longer exists')) {
          // TODO: This is a bit of a tangled mess.
          // listenToOutputServices()
          //   .then(() => {
          //     console.log('Attempted to fix missing gatt!');
          //   })
          //   .catch(() => {
          //     console.error(
          //       'Failed to fix missing GATT service issue. Uncharted territory',
          //     );
          //   });
        }
      }

      get(bluetoothServiceActionQueue).busy = false;
      processServiceActionQueue();
    });
};

const clearBluetoothServiceActionQueue = () => {
  bluetoothServiceActionQueue.set({ busy: false, queue: [] });
};

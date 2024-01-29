/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { isDevMode } from '../environment';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import MBSpecs from './MBSpecs';
import { CharacteristicDataTarget } from './MicrobitBluetooth';
import {
  onAccelerometerChange,
  onButtonChange,
  onUARTDataReceived,
} from './change-listeners';
import {
  stateOnAssigned,
  stateOnBluetoothConnected,
  stateOnDisconnected,
  stateOnReady,
} from './state-updaters';

// const disconnectListeners: (() => Promise<void>)[] = [];
const disconnectListeners: Record<
  DeviceRequestStates,
  (() => Promise<void>) | undefined
> = {
  [DeviceRequestStates.NONE]: undefined,
  [DeviceRequestStates.INPUT]: undefined,
  [DeviceRequestStates.OUTPUT]: undefined,
};

interface BluetoothConnection {
  device?: BluetoothDevice;
  success: boolean;
}

export const startBluetoothConnection = async (
  name: string,
  requestState: DeviceRequestStates,
  existingDevice: BluetoothDevice | undefined,
): Promise<BluetoothConnection> => {
  let device: BluetoothDevice | undefined;
  if (!existingDevice) {
    device = await requestBluetoothDevice(name);
    if (!device) {
      // TODO: Handle this or the UI does the right thing already?
      console.log('temp logging: no Bluetooth device');
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

  // TODO: This will throw if it fails. Do we need to handle it properly?
  // At least remove the disconnectListener if it fails.
  const { gattServer } = await connectBluetoothDevice(device, requestState);

  if (requestState === DeviceRequestStates.INPUT) {
    await listenToBluetoothInputServices(gattServer);
  }
  stateOnReady(requestState);
  stateOnAssigned(requestState);
  return {
    success: true,
    device,
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
    isDevMode && console.log(e);
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
    // TODO: This is conditional in the original code. I'm not sure why.
    if (gattServer.connected) {
      stateOnBluetoothConnected(requestState);
    }
    return {
      gattServer,
      microbitVersion,
    };
  } catch (e) {
    if (device.gatt !== undefined) {
      // In case bluetooth was connected but some other error occurs, disconnect bluetooth to keep consistent state
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
  // TOOD: This is output only, but will need implementing.
  // this.clearBluetoothServiceActionQueue();
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
    await connectBluetoothDevice(device, requestState);
    if (requestState === DeviceRequestStates.INPUT) {
      await listenToBluetoothInputServices(device.gatt);
    }
    stateOnReady(requestState);
    stateOnAssigned(requestState);
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
    isDevMode && console.log(e);
    disconnectBluetoothDevice(device, requestState, false);
  }
};

const listenToBluetoothInputServices = async (
  gattServer: BluetoothRemoteGATTServer,
): Promise<void> => {
  if (!gattServer.connected) {
    throw new Error('Could not listen to services, no microbit connected!');
  }
  try {
    await listenToBlueoothAccelerometer(gattServer, onAccelerometerChange);
    await listenToBluetoothButton(gattServer, 'A', onButtonChange);
    await listenToBluetoothButton(gattServer, 'B', onButtonChange);
    await listenToBluetoothUART(gattServer, onUARTDataReceived);
  } catch (error) {
    console.log(error);
  }
};

const listenToBluetoothButton = async (
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

const listenToBlueoothAccelerometer = async (
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

const listenToBluetoothUART = async (
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

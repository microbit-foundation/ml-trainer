/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { isDevMode } from '../environment';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import MBSpecs from './MBSpecs';
import { CharacteristicDataTarget } from './MicrobitBluetooth';
import { onAccelerometerChange, onUARTDataReceived } from './change-listeners';
import {
  stateOnAssigned,
  stateOnBluetoothConnected,
  stateOnExpelled,
  stateOnReady,
} from './state-updaters';

const disconnectListeners: (() => Promise<void>)[] = [];

interface BluetoothConnection {
  device?: BluetoothDevice;
  success: boolean;
}

export const startBluetoothConnection = async (
  name: string,
  requestState: DeviceRequestStates,
): Promise<BluetoothConnection> => {
  const device = await requestBluetoothDevice(name);
  if (!device) {
    console.log('temp logging: no Bluetooth device');
    return {
      success: false,
    };
  }

  const disconnectListener = createDisconnectListener(device, requestState);
  disconnectListeners.push(disconnectListener);
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
    isDevMode && console.error(e);
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
) => {
  stateOnExpelled(requestState);
  const disconnectListener = disconnectListeners.shift();
  if (disconnectListener) {
    device.removeEventListener('gattserverdisconnected', disconnectListener);
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
    isDevMode && console.error(e);
    disconnectBluetoothDevice(device, requestState);
  }
};

// TODO: uncomment and implement missing parts.
const listenToBluetoothInputServices = async (
  gattServer: BluetoothRemoteGATTServer,
): Promise<void> => {
  // if (!this.isInputConnected()) {
  //   throw new Error('Could not listen to services, no microbit connected!');
  // }
  try {
    await listenToBlueoothAccelerometer(gattServer, onAccelerometerChange);
  } catch (error) {
    console.error(error);
  }
  // await this.getInput().listenToButton(
  //   'A',
  //   connectionBehaviour.buttonChange.bind(connectionBehaviour),
  // );
  // await this.getInput().listenToButton(
  //   'B',
  //   connectionBehaviour.buttonChange.bind(connectionBehaviour),
  // );
  try {
    await listenToBluetoothUART(gattServer, onUARTDataReceived);
  } catch (error) {
    console.error(error);
  }
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

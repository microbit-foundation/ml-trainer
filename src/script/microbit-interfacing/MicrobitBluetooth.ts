/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import StaticConfiguration from '../../StaticConfiguration';
import { isDevMode } from '../environment';
import { DeviceRequestStates } from '../stores/connectDialogStore';
import { outputting } from '../stores/uiStore';
import { logError, logMessage } from '../utils/logging';
import MBSpecs from './MBSpecs';
import MicrobitConnection from './MicrobitConnection';
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

/**
 * UART data target. For fixing type compatibility issues.
 */
export type CharacteristicDataTarget = EventTarget & {
  value: DataView;
};

type OutputCharacteristics = {
  io: BluetoothRemoteGATTCharacteristic;
  matrix: BluetoothRemoteGATTCharacteristic;
  uart: BluetoothRemoteGATTCharacteristic;
};

export class MicrobitBluetooth implements MicrobitConnection {
  // Available after successful connect
  microbitVersion: MBSpecs.MBVersion | undefined;
  inUseAs: Set<DeviceRequestStates> = new Set();

  private outputCharacteristics: OutputCharacteristics | undefined;

  // Used to avoid automatic reconnection for user triggered disconnects.
  private duringUserDisconnect: boolean = false;

  private actionQueue: {
    busy: boolean;
    queue: Array<(outputCharacteristics: OutputCharacteristics) => Promise<void>>;
  } = {
    busy: false,
    queue: [],
  };

  constructor(
    public readonly name: string,
    public readonly device: BluetoothDevice,
  ) {
    device.addEventListener('gattserverdisconnected', this.handleDisconnectEvent);
  }

  // mth: Let's use this when we no longer care about this micro:bit at all.
  dispose() {
    this.device.removeEventListener('gattserverdisconnected', this.handleDisconnectEvent);
  }

  async connect(...states: DeviceRequestStates[]): Promise<void> {
    logMessage('Bluetooth connect', states);
    if (this.device.gatt === undefined) {
      throw new Error('BluetoothRemoteGATTServer for microbit device is undefined');
    }
    try {
      logMessage('Bluetooth GATT server connecting');

      // On ChromeOS and Mac there's no timeout and no clear way to abort.

      // Perhaps we could reload the page with a flag to indicate it should
      // restart the connection process?
      // Or we mark this connection process as timed out and recreate
      // the device.

      // On Windows it times out after 7s so that should work well.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=684073
      await this.device.gatt.connect();

      logMessage('Bluetooth GATT server connected');
      const microbitVersion = await MBSpecs.Utility.getModelNumber(
        this.assertGattServer(),
      );
      this.microbitVersion = microbitVersion;
      states.forEach(stateOnConnected);
      if (states.includes(DeviceRequestStates.INPUT)) {
        await this.listenToInputServices();
      }
      if (states.includes(DeviceRequestStates.OUTPUT)) {
        await this.listenToOutputServices();
      }
      states.forEach(s => this.inUseAs.add(s));
      states.forEach(s => stateOnAssigned(s, microbitVersion));
      states.forEach(s => stateOnReady(s));
    } catch (e) {
      logError('Bluetooth connect error', e);
      if (this.device.gatt !== undefined) {
        // In case bluetooth was connected but some other error occurs.
        // Disconnect bluetooth to keep consistent state.
        this.device.gatt.disconnect();
      }
      states.forEach(s => stateOnFailedToConnect(s));
      throw new Error('Failed to establish a connection!');
    }
  }

  async disconnect(userDisconnect: boolean): Promise<void> {
    logMessage('Bluetooth disconnect', userDisconnect);
    this.actionQueue = { busy: false, queue: [] };
    this.duringUserDisconnect = true;
    try {
      this.device.gatt?.disconnect();
    } catch (e) {
      logError('Bluetooth GATT disconnect error (ignored)', e);
      // We might have already lost the connection.
    } finally {
      this.duringUserDisconnect = false;
    }

    this.inUseAs.forEach(value => stateOnDisconnected(value, userDisconnect));
  }

  async reconnect(): Promise<void> {
    logMessage('Bluetooth reconnect');
    const as = Array.from(this.inUseAs);
    await this.disconnect(true);
    await this.connect(...as);
  }

  handleDisconnectEvent = async (): Promise<void> => {
    try {
      if (!this.duringUserDisconnect) {
        logMessage('Bluetooth GATT disconnected... automatically trying reconnect');
        await this.connect(...this.inUseAs);
      } else {
        logMessage('Bluetooth GATT disconnect ignored during user disconnect');
      }
    } catch (e) {
      logError('Bluetooth connect triggered by disconnect listener failed', e);
      this.inUseAs.forEach(s => stateOnDisconnected(s, false));
    }
  };

  private assertGattServer(): BluetoothRemoteGATTServer {
    if (!this.device.gatt?.connected) {
      throw new Error('Could not listen to services, no microbit connected!');
    }
    return this.device.gatt;
  }

  private async listenToInputServices(): Promise<void> {
    await this.listenToAccelerometer();
    await this.listenToButton('A');
    await this.listenToButton('B');

    // Duplicated beween input and output!
    await this.listenToUART();
  }

  private async listenToButton(buttonToListenFor: MBSpecs.Button): Promise<void> {
    const gattServer = this.assertGattServer();
    const buttonService = await gattServer.getPrimaryService(
      MBSpecs.Services.BUTTON_SERVICE,
    );

    // Select the correct characteristic to listen to.
    const uuid =
      buttonToListenFor === 'A'
        ? MBSpecs.Characteristics.BUTTON_A
        : MBSpecs.Characteristics.BUTTON_B;
    const buttonCharacteristic = await buttonService.getCharacteristic(uuid);

    await buttonCharacteristic.startNotifications();

    buttonCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        const target = event.target as CharacteristicDataTarget;
        const stateId = target.value.getUint8(0);
        let state = MBSpecs.ButtonStates.Released;
        if (stateId === 1) {
          state = MBSpecs.ButtonStates.Pressed;
        }
        if (stateId === 2) {
          state = MBSpecs.ButtonStates.LongPressed;
        }
        onButtonChange(state, buttonToListenFor);
      },
    );
  }

  private async listenToAccelerometer(): Promise<void> {
    const gattServer = this.assertGattServer();
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
        onAccelerometerChange(x, y, z);
      },
    );
  }

  private async listenToUART(): Promise<void> {
    const gattServer = this.assertGattServer();
    const uartService = await gattServer.getPrimaryService(MBSpecs.Services.UART_SERVICE);
    const uartTXCharacteristic = await uartService.getCharacteristic(
      MBSpecs.Characteristics.UART_DATA_TX,
    );
    await uartTXCharacteristic.startNotifications();
    uartTXCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event: Event) => {
        // Convert the data to a string.
        const receivedData: number[] = [];
        const target = event.target as CharacteristicDataTarget;
        for (let i = 0; i < target.value.byteLength; i += 1) {
          receivedData[i] = target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        // Hmm...
        this.inUseAs.forEach(state => onUARTDataReceived(state, receivedString));
      },
    );
  }

  private async listenToOutputServices(): Promise<void> {
    const gattServer = this.assertGattServer();
    if (!gattServer.connected) {
      throw new Error('Could not listen to services, no microbit connected!');
    }
    const ioService = await gattServer.getPrimaryService(MBSpecs.Services.IO_SERVICE);
    const io = await ioService.getCharacteristic(MBSpecs.Characteristics.IO_DATA);
    const ledService = await gattServer.getPrimaryService(MBSpecs.Services.LED_SERVICE);
    const matrix = await ledService.getCharacteristic(
      MBSpecs.Characteristics.LED_MATRIX_STATE,
    );
    const uartService = await gattServer.getPrimaryService(MBSpecs.Services.UART_SERVICE);
    const uart = await uartService.getCharacteristic(
      MBSpecs.Characteristics.UART_DATA_RX,
    );
    this.outputCharacteristics = {
      io,
      matrix,
      uart,
    };

    // mth: We do this twice if we're the input and output micro:bit but that doesn't make sense.
    await this.listenToUART();
  }

  private setPinInternal = (pin: MBSpecs.UsableIOPin, on: boolean): void => {
    this.queueAction(outputCharacteristics => {
      const dataView = new DataView(new ArrayBuffer(2));
      dataView.setInt8(0, pin);
      dataView.setInt8(1, on ? 1 : 0);
      outputting.set({ text: `Turn pin ${pin} ${on ? 'on' : 'off'}` });
      return outputCharacteristics.io.writeValue(dataView);
    });
  };

  // Counter tracking the pin state. Incremented when we turn it on
  // and decremented when we turn it off. This avoids us turning off
  // pins that others have turned on (i.e. we bias towards enabling
  // pins).
  private pinStateCounters = new Map<MBSpecs.UsableIOPin, number>();

  setPin(pin: MBSpecs.UsableIOPin, on: boolean): void {
    let stateCounter = this.pinStateCounters.get(pin) ?? 0;
    stateCounter = stateCounter + (on ? 1 : -1);
    // Has it transitioned to off or on?
    const changed = stateCounter === 0 || stateCounter === 1;
    this.pinStateCounters.set(pin, Math.max(0, stateCounter));
    if (changed) {
      this.setPinInternal(pin, on);
    }
  }

  resetPins = () => {
    this.pinStateCounters = new Map();
    StaticConfiguration.supportedPins.forEach(value => {
      this.setPinInternal(value, false);
    });
  };

  setLeds = (matrix: boolean[]): void => {
    this.queueAction(outputCharacteristics => {
      const dataView = new DataView(new ArrayBuffer(5));
      for (let i = 0; i < 5; i++) {
        dataView.setUint8(
          i,
          matrix
            .slice(i * 5, 5 + i * 5)
            .reduce((byte, bool) => (byte << 1) | (bool ? 1 : 0), 0),
        );
      }
      return outputCharacteristics.matrix.writeValue(dataView);
    });
  };

  /**
   * Sends a message through UART
   * @param type The type of UART message, i.e 'g' for gesture and 's' for sound
   * @param value The message
   */
  sendToOutputUart = (type: UARTMessageType, value: string): void => {
    this.queueAction(outputCharacteristics => {
      const view = MBSpecs.Utility.messageToDataview(`${type}_${value}`);
      return outputCharacteristics.uart.writeValue(view);
    });
  };

  queueAction = (
    action: (outputCharacteristics: OutputCharacteristics) => Promise<void>,
  ) => {
    this.actionQueue.queue.push(action);
    this.processActionQueue();
  };

  processActionQueue = () => {
    if (!this.outputCharacteristics) {
      // We've become disconnected before processing all actions.
      this.actionQueue = {
        busy: false,
        queue: [],
      };
      return;
    }
    if (this.actionQueue.busy) {
      return;
    }
    const action = this.actionQueue.queue.shift();
    if (action) {
      this.actionQueue.busy = true;
      action(this.outputCharacteristics)
        .then(() => {
          this.actionQueue.busy = false;
          this.processActionQueue();
        })
        .catch(e => {
          logError('Error processing action queue', e);
          // Do we want to keep going if we hit errors?
          // What did it do previously?
          this.actionQueue.busy = false;
          this.processActionQueue();
        });
    }
  };
}

export const startBluetoothConnection = async (
  name: string,
  requestState: DeviceRequestStates,
): Promise<MicrobitBluetooth | undefined> => {
  const device = await requestDevice(name);
  if (!device) {
    return undefined;
  }
  try {
    const bluetooth = new MicrobitBluetooth(name, device);
    await bluetooth.connect(requestState);
    return bluetooth;
  } catch (e) {
    return undefined;
  }
};

const requestDevice = async (name: string): Promise<BluetoothDevice | undefined> => {
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
    return undefined;
  }
};

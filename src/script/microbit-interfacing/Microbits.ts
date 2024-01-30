/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import MicrobitUSB from './MicrobitUSB';
import {
  MicrobitBluetooth,
  disconnectBluetoothDevice,
  startBluetoothConnection,
} from './microbit-bluetooth';
import { disconnectSerial, startSerialConnection } from './microbit-serial';

export enum HexOrigin {
  UNKNOWN,
  MAKECODE,
  PROPRIETARY,
}
export type FlashStage = 'bluetooth' | 'radio-sender' | 'radio-bridge';
export type HexType = 'bluetooth' | 'radio-sender' | 'radio-bridge' | 'radio-local';
export type UARTMessageType = 'g' | 's';

export const getHexFileUrl = (version: 1 | 2 | 'universal', type: HexType) => {
  if (type === 'bluetooth') {
    return {
      1: 'firmware/ml-microbit-cpp-version-combined.hex',
      2: 'firmware/MICROBIT.hex',
      universal: 'firmware/universal-hex.hex',
    }[version];
  }
  if (version !== 2) {
    throw new Error('Only V2 is supported');
  }
  return {
    'radio-sender': 'firmware/radio-sender.hex',
    'radio-bridge': 'firmware/radio-bridge.hex',
    'radio-local': 'firmware/radio-local.hex',
  }[type];
};

class Microbits {
  private static inputMicrobit: MicrobitBluetooth | MicrobitUSB | undefined = undefined;
  private static outputMicrobit: MicrobitBluetooth | undefined = undefined;

  private static linkedMicrobit: MicrobitUSB | undefined = undefined;

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    const connectionResult = await startBluetoothConnection(
      name,
      DeviceRequestStates.INPUT,
      this.inputMicrobit instanceof MicrobitBluetooth
        ? this.inputMicrobit.device
        : undefined,
    );
    this.outputMicrobit = connectionResult.success ? connectionResult.result : undefined;
    return connectionResult.success;
  }

  public static async assignSerialInput(): Promise<boolean> {
    const serialResult = await startSerialConnection(DeviceRequestStates.INPUT);
    this.inputMicrobit = serialResult.success ? serialResult.result : undefined;
    return serialResult.success;
  }

  public static async assignBluetoothOuput(name: string): Promise<boolean> {
    const connectionResult = await startBluetoothConnection(
      name,
      DeviceRequestStates.OUTPUT,
      this.outputMicrobit instanceof MicrobitBluetooth
        ? this.outputMicrobit.device
        : undefined,
    );
    this.outputMicrobit = connectionResult.success ? connectionResult.result : undefined;
    return connectionResult.success;
  }

  public static async reconnect(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT && this.inputMicrobit) {
      // mth: Can we make this nice?
      if (this.inputMicrobit instanceof MicrobitUSB) {
        return this.assignSerialInput();
      } else {
        return this.assignBluetoothInput(this.inputMicrobit.name);
      }
    }
    if (requestState === DeviceRequestStates.OUTPUT && this.outputMicrobit) {
      return this.assignBluetoothOuput(this.outputMicrobit.name);
    }
    throw new Error('Cannot reconnect. There are no previously connected devices.');
  }

  private static getMicrobit(
    state: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ): MicrobitUSB | MicrobitBluetooth | undefined {
    return state === DeviceRequestStates.INPUT ? this.inputMicrobit : this.outputMicrobit;
  }

  public static async disconnect(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ) {
    // mth: aspirational!
    // this.getMicrobit(requestState)?.disconnect();

    if (requestState === DeviceRequestStates.INPUT && this.inputMicrobit) {
      if (this.inputMicrobit instanceof MicrobitUSB) {
        await disconnectSerial(this.inputMicrobit, DeviceRequestStates.INPUT, true);
      } else {
        await disconnectBluetoothDevice(
          this.inputMicrobit.device,
          DeviceRequestStates.INPUT,
          true,
        );
      }
    } else if (requestState === DeviceRequestStates.OUTPUT && this.outputMicrobit) {
      if (!(this.outputMicrobit instanceof MicrobitUSB)) {
        await disconnectBluetoothDevice(
          this.outputMicrobit.device,
          DeviceRequestStates.OUTPUT,
          true,
        );
      }
    }
  }

  public static async disconnectInputAndOutput() {
    await this.disconnect(DeviceRequestStates.INPUT);
    await this.disconnect(DeviceRequestStates.OUTPUT);
  }

  public static hasDeviceReference(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT) {
      return !!this.inputMicrobit;
    }
    return !!this.outputMicrobit;
  }

  /**
   * Attempts to create a connection to a USB-connected microbit
   */
  public static async linkMicrobit(): Promise<void> {
    this.linkedMicrobit = await MicrobitUSB.requestConnection();
  }

  /**
   * Gets the microbit connected through USB.
   * @returns The USB-Connected microbit
   */
  public static getLinked(): MicrobitUSB {
    if (!this.linkedMicrobit) {
      throw new Error('No microbit has been linked!');
    }
    return this.linkedMicrobit;
  }

  public static async getLinkedFriendlyName(): Promise<string> {
    if (!this.linkedMicrobit) {
      throw new Error('Cannot get friendly name from USB, none are connected!');
    }
    return this.linkedMicrobit.getFriendlyName();
  }

  /**
   * Flashes the appropriate hex file to the micro:bit which is connected via USB
   * @param progressCallback The callback that is fired each time the progress status is updated
   */
  public static flashHexToLinked(
    hexType: HexType,
    progressCallback: (progress: number) => void,
  ): Promise<void> {
    if (!this.linkedMicrobit) {
      throw new Error('Cannot flash to USB, none are connected!');
    }
    const version = this.linkedMicrobit.getModelNumber();
    const hex = getHexFileUrl(version, hexType); // Note: For this we CANNOT use the universal hex file (don't know why)
    return this.linkedMicrobit.flashHex(hex, progressCallback);
  }
}

export default Microbits;

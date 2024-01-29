/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import MicrobitUSB from './MicrobitUSB';
import {
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

class MicrobitsAlt {
  private static assignedInputMicrobit: BluetoothDevice | MicrobitUSB | undefined =
    undefined;
  private static assignedOutputMicrobit: BluetoothDevice | MicrobitUSB | undefined =
    undefined;
  private static inputName: string | undefined = undefined;
  private static outputName: string | undefined = undefined;
  private static linkedMicrobit: MicrobitUSB | undefined = undefined;

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    const { success, device } = await startBluetoothConnection(
      name,
      DeviceRequestStates.INPUT,
      this.assignedInputMicrobit instanceof MicrobitUSB
        ? undefined
        : this.assignedInputMicrobit,
    );
    if (success && device) {
      this.inputName = name;
      this.assignedInputMicrobit = device;
    } else {
      this.inputName = undefined;
      this.assignedInputMicrobit = undefined;
    }
    return success;
  }

  public static async assignSerialInput(name: string): Promise<boolean> {
    const { success, device } = await startSerialConnection(DeviceRequestStates.INPUT);
    if (success && device) {
      this.inputName = name;
      this.assignedInputMicrobit = device;
    } else {
      this.inputName = undefined;
      this.assignedInputMicrobit = undefined;
    }
    return success;
  }

  public static async assignBluetoothOuput(name: string): Promise<boolean> {
    const { success, device } = await startBluetoothConnection(
      name,
      DeviceRequestStates.OUTPUT,
      this.assignedOutputMicrobit instanceof MicrobitUSB
        ? undefined
        : this.assignedOutputMicrobit,
    );
    if (success && device) {
      this.outputName = name;
      this.assignedOutputMicrobit = device;
    } else {
      this.outputName = undefined;
      this.assignedOutputMicrobit = undefined;
    }
    return success;
  }

  public static async reconnect(requestState: DeviceRequestStates) {
    if (
      requestState === DeviceRequestStates.INPUT &&
      this.inputName &&
      this.assignedInputMicrobit
    ) {
      if (this.assignedInputMicrobit instanceof MicrobitUSB) {
        return this.assignSerialInput(this.inputName);
      } else {
        return this.assignBluetoothInput(this.inputName);
      }
    }
    if (
      requestState === DeviceRequestStates.OUTPUT &&
      this.outputName &&
      this.assignedOutputMicrobit
    ) {
      return this.assignBluetoothOuput(this.outputName);
    }
    throw new Error('Cannot reconnect. There are no previously connected devices.');
  }

  public static async disconnect(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT && this.assignedInputMicrobit) {
      if (this.assignedInputMicrobit instanceof MicrobitUSB) {
        await disconnectSerial(
          this.assignedInputMicrobit,
          DeviceRequestStates.INPUT,
          true,
        );
      } else {
        await disconnectBluetoothDevice(
          this.assignedInputMicrobit,
          DeviceRequestStates.INPUT,
          true,
        );
      }
    } else if (
      requestState === DeviceRequestStates.OUTPUT &&
      this.assignedOutputMicrobit
    ) {
      if (!(this.assignedOutputMicrobit instanceof MicrobitUSB)) {
        await disconnectBluetoothDevice(
          this.assignedOutputMicrobit,
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
      return !!this.assignedInputMicrobit;
    }
    return !!this.assignedOutputMicrobit;
  }

  public static getDeviceName(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT) {
      return this.inputName;
    }
    return this.outputName;
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

export default MicrobitsAlt;

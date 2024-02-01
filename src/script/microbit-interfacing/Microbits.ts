/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import MicrobitConnection from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import { MicrobitBluetooth, startBluetoothConnection } from './microbit-bluetooth';
import { MicrobitSerial, startSerialConnection } from './microbit-serial';

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
  private static inputMicrobit: MicrobitConnection | undefined = undefined;
  private static outputMicrobit: MicrobitBluetooth | undefined = undefined;

  private static linkedMicrobit: MicrobitUSB | undefined = undefined;

  public static getOutputMicrobit(): MicrobitBluetooth {
    if (!this.outputMicrobit) {
      throw new Error('No output micro:bit!');
    }
    return this.outputMicrobit;
  }

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    this.inputMicrobit = await startBluetoothConnection(name, DeviceRequestStates.INPUT);
    return !!this.inputMicrobit;
  }

  public static async assignSerialInput(): Promise<boolean> {
    this.inputMicrobit = await startSerialConnection(DeviceRequestStates.INPUT);
    return !!this.inputMicrobit;
  }

  public static async assignBluetoothOutput(name: string): Promise<boolean> {
    // If it's the input micro:bit then grab the input micro:bit reference
    // use it as the output micro:bit and connect it in that mode too.
    if (
      this.inputMicrobit instanceof MicrobitBluetooth &&
      this.inputMicrobit.name === name
    ) {
      await this.inputMicrobit.connect(DeviceRequestStates.OUTPUT);
      this.outputMicrobit = this.inputMicrobit;
      return true;
    } else {
      this.outputMicrobit = await startBluetoothConnection(
        name,
        DeviceRequestStates.OUTPUT,
      );
      return !!this.outputMicrobit;
    }
  }

  public static async reconnect(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT && this.inputMicrobit) {
      await this.inputMicrobit.reconnect();
    }
    if (requestState === DeviceRequestStates.OUTPUT && this.outputMicrobit) {
      await this.outputMicrobit.reconnect();
    }
  }

  private static getMicrobit(
    state: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ): MicrobitConnection | undefined {
    return state === DeviceRequestStates.INPUT ? this.inputMicrobit : this.outputMicrobit;
  }

  public static async disconnect(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ) {
    // This isn't right as it will disconnect a shared micro:bit
    // We need to stop using it as the X micro:bit, perhaps? But what's the UI level intent?
    return this.getMicrobit(requestState)?.disconnect(true);
  }

  // Can we kill this?
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

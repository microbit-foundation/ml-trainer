/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import MicrobitConnection, { DeviceRequestStates } from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import { MicrobitBluetooth, startBluetoothConnection } from './MicrobitBluetooth';
import { startSerialConnection } from './MicrobitSerial';
import { isUniversalHex, separateUniversalHex } from '@microbit/microbit-universal-hex';

export type FlashStage = 'bluetooth' | 'radio-remote' | 'radio-bridge';
export type HexType =
  | 'bluetooth'
  | 'radio-remote'
  | 'radio-bridge'
  | 'radio-local'
  | 'radio-remote-dev';

export type HexVersion = 1 | 2 | 'universal';
// g - gesture, s - sound, f - field collection
export type UARTMessageType = 'g' | 's' | 'f';

export const getHexStrForVersion = (hexStr: string, version: HexVersion) => {
  if (isUniversalHex(hexStr)) {
    let hexV1: string | null = null;
    let hexV2: string | null = null;
    let separatedBinaries = separateUniversalHex(hexStr);
    separatedBinaries.forEach(hexObj => {
      if (hexObj.boardId === 0x9900 || hexObj.boardId === 0x9901) {
        hexV1 = hexObj.hex;
      } else if (
        hexObj.boardId === 0x9903 ||
        hexObj.boardId === 0x9904 ||
        hexObj.boardId === 0x9905 ||
        hexObj.boardId === 0x9906
      ) {
        hexV2 = hexObj.hex;
      }
    });
    if (!hexV1 || !hexV2) {
      throw new Error('Could not find parts of universal hex');
    }
    return {
      1: hexV1,
      2: hexV2,
      universal: hexStr,
    }[version];
  }
  // Not a universal hex, no splitting needed
  return hexStr;
};

export const getHexFileUrl = (version: HexVersion, type: HexType): string | undefined => {
  if (type === 'bluetooth') {
    return {
      1: 'firmware/ml-microbit-cpp-version-combined.hex',
      2: 'firmware/MICROBIT.hex',
      universal: 'firmware/universal-hex.hex',
    }[version];
  }
  if (version !== 2) {
    return undefined;
  }
  return {
    'radio-remote-dev': 'firmware/radio-remote-v0.2.1-dev.hex',
    'radio-remote': 'firmware/radio-remote-v0.2.1.hex',
    'radio-bridge': 'firmware/radio-bridge-v0.2.1.hex',
    'radio-local': 'firmware/local-sensors-v0.2.1.hex',
  }[type];
};

class Microbits {
  private static inputMicrobit: MicrobitConnection | undefined = undefined;
  private static outputMicrobit: MicrobitBluetooth | undefined = undefined;

  public static getInputMicrobit(): MicrobitConnection | undefined {
    return this.inputMicrobit;
  }

  public static getOutputMicrobit(): MicrobitBluetooth | undefined {
    return this.outputMicrobit;
  }

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    this.inputMicrobit = await startBluetoothConnection(name, DeviceRequestStates.INPUT);
    return !!this.inputMicrobit;
  }

  public static async assignSerialInput(
    usb: MicrobitUSB,
    remoteDeviceId: number,
  ): Promise<boolean> {
    this.inputMicrobit = await startSerialConnection(
      usb,
      DeviceRequestStates.INPUT,
      remoteDeviceId,
    );
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

  public static async reconnect(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
    finalAttempt: boolean = false,
  ) {
    return this.getMicrobit(requestState)?.reconnect(finalAttempt);
  }

  public static async disconnect(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ) {
    // For now disconnect disconnects as input and output if the same device
    // is both.
    return this.getMicrobit(requestState)?.disconnect();
  }

  private static getMicrobit(
    state: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ): MicrobitConnection | undefined {
    return state === DeviceRequestStates.INPUT ? this.inputMicrobit : this.outputMicrobit;
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

  public static async dispose(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ) {
    if (requestState === DeviceRequestStates.INPUT) {
      this.inputMicrobit = undefined;
    } else {
      this.outputMicrobit = undefined;
    }
  }
}

export default Microbits;

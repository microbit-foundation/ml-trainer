/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { startConnectionProcess } from '../stores/connectDialogStore';
import MicrobitConnection, { DeviceRequestStates } from './MicrobitConnection';
import MicrobitUSB from './MicrobitUSB';
import { MicrobitBluetooth, startBluetoothConnection } from './MicrobitBluetooth';
import { startSerialConnection } from './MicrobitSerial';
import { stateOnStopOfferingReconnect } from './state-updaters';

export type FlashStage = 'bluetooth' | 'radio-sender' | 'radio-bridge';
export type HexType =
  | 'bluetooth'
  | 'radio-sender'
  | 'radio-bridge'
  | 'radio-local'
  | 'radio-sender-dev';

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
    'radio-sender-dev': 'firmware/radio-remote-v0.1.0-dev.hex',
    'radio-sender': 'firmware/radio-remote-v0.1.0.hex',
    'radio-bridge': 'firmware/radio-bridge-v0.1.0.hex',
    'radio-local': 'firmware/local-sensors-v0.1.0.hex',
  }[type];
};

class Microbits {
  private static inputMicrobit: MicrobitConnection | undefined = undefined;
  private static outputMicrobit: MicrobitBluetooth | undefined = undefined;

  public static getOutputMicrobit(): MicrobitBluetooth | undefined {
    return this.outputMicrobit;
  }

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    this.inputMicrobit = await startBluetoothConnection(name, DeviceRequestStates.INPUT);
    return !!this.inputMicrobit;
  }

  public static async assignSerialInput(usb: MicrobitUSB): Promise<boolean> {
    this.inputMicrobit = await startSerialConnection(usb, DeviceRequestStates.INPUT);
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
  ) {
    try {
      await this.getMicrobit(requestState)?.reconnect(true);
    } catch (e) {
      startConnectionProcess();
    } finally {
      stateOnStopOfferingReconnect();
    }
  }

  public static async disconnect(
    requestState: DeviceRequestStates.INPUT | DeviceRequestStates.OUTPUT,
  ) {
    // This isn't right as it will disconnect a shared micro:bit
    // We need to stop using it as the X micro:bit, perhaps? But what's the UI level intent?
    return this.getMicrobit(requestState)?.disconnect(true);
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
}

export default Microbits;

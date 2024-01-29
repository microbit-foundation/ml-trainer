/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { DeviceRequestStates } from '../stores/connectDialogStore';
import {
  disconnectBluetoothDevice,
  startBluetoothConnection,
} from './microbit-bluetooth';

class MicrobitsAlt {
  private static assignedInputMicrobit: BluetoothDevice | undefined = undefined;
  private static assignedOutputMicrobit: BluetoothDevice | undefined = undefined;
  private static inputName: string | undefined = undefined;
  private static outputName: string | undefined = undefined;

  public static async assignBluetoothInput(name: string): Promise<boolean> {
    const { success, device } = await startBluetoothConnection(
      name,
      DeviceRequestStates.INPUT,
      this.assignedInputMicrobit,
    );
    if (success && device) {
      this.inputName = name;
      this.assignedInputMicrobit = device;
    }
    return success;
  }

  public static async assignBluetoothOuput(name: string): Promise<boolean> {
    const { success, device } = await startBluetoothConnection(
      name,
      DeviceRequestStates.OUTPUT,
      this.assignedOutputMicrobit,
    );
    if (success && device) {
      this.outputName = name;
      this.assignedOutputMicrobit = device;
    }
    return success;
  }

  public static async disconnect(requestState: DeviceRequestStates) {
    if (requestState === DeviceRequestStates.INPUT && this.assignedInputMicrobit) {
      await disconnectBluetoothDevice(
        this.assignedInputMicrobit,
        DeviceRequestStates.INPUT,
        true,
      );
    } else if (
      requestState === DeviceRequestStates.OUTPUT &&
      this.assignedOutputMicrobit
    ) {
      await disconnectBluetoothDevice(
        this.assignedOutputMicrobit,
        DeviceRequestStates.OUTPUT,
        true,
      );
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
}

export default MicrobitsAlt;

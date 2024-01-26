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
    );
    if (success && device) {
      this.outputName = name;
      this.assignedOutputMicrobit = device;
    }
    return success;
  }

  public static async expelInput() {
    if (this.assignedInputMicrobit) {
      await disconnectBluetoothDevice(
        this.assignedInputMicrobit,
        DeviceRequestStates.INPUT,
      );
    }
  }

  public static async expelOuput() {
    if (this.assignedOutputMicrobit) {
      await disconnectBluetoothDevice(
        this.assignedOutputMicrobit,
        DeviceRequestStates.OUTPUT,
      );
    }
  }

  public static async expelInputAndOutput() {
    await this.expelInput();
    await this.expelOuput();
  }
}

export default MicrobitsAlt;

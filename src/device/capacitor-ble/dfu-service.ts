import {
  BleClient,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import { Device } from "./bluetooth";

const MICROBIT_DFU_CHARACTERISTIC = "e95d93b1-251d-470a-a062-fa1922dfa9a8";
const MICROBIT_DFU_SERVICE = "e95d93b0-251d-470a-a062-fa1922dfa9a8";

// This is the service that should be available on V1 after the reboot.
export const NORDIC_DFU_SERVICE = "00001530-1212-EFDE-1523-785FEABCD123";

export class DfuService {
  constructor(private device: Device) {}

  /**
   * We do this for V1 only.
   */
  async requestRebootToBootloader() {
    await BleClient.write(
      this.device.deviceId,
      MICROBIT_DFU_SERVICE,
      MICROBIT_DFU_CHARACTERISTIC,
      numbersToDataView([0x01])
    );
  }
}

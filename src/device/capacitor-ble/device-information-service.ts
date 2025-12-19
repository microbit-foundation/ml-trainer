import { BleClient } from "@capacitor-community/bluetooth-le";
import { Device } from "./bluetooth";
import { BoardVersion } from "@microbit/microbit-connection";

// Device Information Service
export const DEVICE_INFORMATION_SERVICE =
  "0000180a-0000-1000-8000-00805f9b34fb";
export const MODEL_NUMBER_CHARACTERISTIC =
  "00002a24-0000-1000-8000-00805f9b34fb";

export class DeviceInformationService {
  constructor(private device: Device) {}

  async getBoardVersion(): Promise<BoardVersion> {
    // Read model number from Device Information Service to determine version
    const modelNumber = await BleClient.read(
      this.device.deviceId,
      DEVICE_INFORMATION_SERVICE,
      MODEL_NUMBER_CHARACTERISTIC
    );
    const decoder = new TextDecoder();
    const modelString = decoder.decode(modelNumber);
    this.device.log(
      `Model number from Device Information Service: ${modelString}`
    );
    if (modelString.includes("V2")) {
      return "V2";
    }
    return "V1";
  }
}

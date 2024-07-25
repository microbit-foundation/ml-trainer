import {
  AccelerometerDataEvent,
  ConnectionStatusEvent,
  ConnectionStatus as DeviceConnectionStatus,
  DeviceError,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { ConnectionFlowType, ConnectionType } from "./connection-stage-hooks";
import { getFlashDataSource } from "./device/get-hex-file";
import { Logging } from "./logging/logging";

export enum ConnectAndFlashResult {
  Success = "Success",
  Failed = "Failed",
  ErrorMicrobitUnsupported = "ErrorMicrobitUnsupported",
  ErrorBadFirmware = "ErrorBadFirmware",
  ErrorNoDeviceSelected = "ErrorNoDeviceSelected",
  ErrorUnableToClaimInterface = "ErrorUnableToClaimInterface",
}

export type ConnectAndFlashFailResult = Exclude<
  ConnectAndFlashResult,
  ConnectAndFlashResult.Success
>;

export enum ConnectResult {
  Success,
  ManualConnectFailed,
  AutomaticConnectFailed,
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Should remove this and use the connection library type
// in the next release.
export type TempButtonEvent = { state: number };

export class ConnectActions {
  private usb: MicrobitWebUSBConnection;
  private bluetooth: MicrobitWebBluetoothConnection;

  constructor(
    private logging: Logging,
    usb: MicrobitWebUSBConnection,
    bluetooth: MicrobitWebBluetoothConnection
  ) {
    this.usb = usb;
    this.bluetooth = bluetooth;
  }

  requestUSBConnectionAndFlash = async (
    hexType: ConnectionFlowType,
    progressCallback: (progress: number) => void
  ): Promise<
    | { result: ConnectAndFlashResult.Success; deviceId: number }
    | { result: ConnectAndFlashFailResult; deviceId?: number }
  > => {
    try {
      await this.usb.connect();
      const result = await this.flashMicrobit(hexType, progressCallback);
      // Save remote micro:bit device id is stored for passing it to bridge micro:bit
      const deviceId = this.usb.getDeviceId();
      if (!deviceId) {
        return { result: ConnectAndFlashResult.Failed };
      }
      return { result, deviceId };
    } catch (e) {
      this.logging.error(
        `USB request device failed/cancelled: ${JSON.stringify(e)}`
      );
      return { result: this.handleConnectAndFlashError(e) };
    }
  };

  private flashMicrobit = async (
    flowType: ConnectionFlowType,
    progress: (progress: number) => void
  ): Promise<ConnectAndFlashResult> => {
    if (!this.usb) {
      return ConnectAndFlashResult.Failed;
    }
    const data = getFlashDataSource(flowType);

    if (!data) {
      return ConnectAndFlashResult.ErrorMicrobitUnsupported;
    }
    try {
      await this.usb.flash(data, {
        partial: true,
        progress: (v: number | undefined) => progress(v ?? 100),
      });
      return ConnectAndFlashResult.Success;
    } catch (e) {
      this.logging.error(`Flashing failed: ${JSON.stringify(e)}`);
      return ConnectAndFlashResult.Failed;
    }
  };

  private handleConnectAndFlashError = (
    err: unknown
  ): ConnectAndFlashFailResult => {
    if (err instanceof DeviceError) {
      switch (err.code) {
        case "clear-connect":
          return ConnectAndFlashResult.ErrorUnableToClaimInterface;
        case "no-device-selected":
          return ConnectAndFlashResult.ErrorNoDeviceSelected;
        case "update-req":
          return ConnectAndFlashResult.ErrorBadFirmware;
        default:
          return ConnectAndFlashResult.Failed;
      }
    }
    return ConnectAndFlashResult.Failed;
  };

  // TODO: Replace with real connecting logic
  connectMicrobitsSerial = async (deviceId: number): Promise<ConnectResult> => {
    await delay(5000);

    // TODO: Use deviceId to assign to connect microbits
    if (!deviceId) {
      return ConnectResult.ManualConnectFailed;
    }
    return ConnectResult.Success;
  };

  connectBluetooth = async (
    name: string | undefined
  ): Promise<ConnectResult> => {
    const status = await this.bluetooth.connect({ name });
    if (status === DeviceConnectionStatus.CONNECTED) {
      return ConnectResult.Success;
    }
    return ConnectResult.ManualConnectFailed;
  };

  addAccelerometerListener = (
    listener: (e: AccelerometerDataEvent) => void
  ) => {
    this.bluetooth?.addEventListener("accelerometerdatachanged", listener);
  };

  removeAccelerometerListener = (
    listener: (e: AccelerometerDataEvent) => void
  ) => {
    this.bluetooth?.removeEventListener("accelerometerdatachanged", listener);
  };

  addButtonListener = (
    button: "A" | "B",
    listener: (e: TempButtonEvent) => void
  ) => {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth?.addEventListener(type, listener);
  };

  removeButtonListener = (
    button: "A" | "B",
    listener: (e: TempButtonEvent) => void
  ) => {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth?.removeEventListener(type, listener);
  };

  disconnect = async () => {
    await this.bluetooth.disconnect();
  };

  addStatusListener = (
    type: ConnectionType,
    listener: (e: ConnectionStatusEvent) => void
  ) => {
    if (type === "bluetooth") {
      this.bluetooth?.addEventListener("status", listener);
    }
  };

  removeStatusListener = (
    type: ConnectionType,
    listener: (e: ConnectionStatusEvent) => void
  ) => {
    if (type === "bluetooth") {
      this.bluetooth?.removeEventListener("status", listener);
    }
  };
}

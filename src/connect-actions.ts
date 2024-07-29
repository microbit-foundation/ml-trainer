import {
  AccelerometerDataEvent,
  ConnectionStatusEvent,
  ButtonEvent,
  ConnectionStatus as DeviceConnectionStatus,
  DeviceError,
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { ConnectionFlowType } from "./connection-stage-hooks";
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

export class ConnectActions {
  constructor(
    private logging: Logging,
    private usb: MicrobitWebUSBConnection,
    private bluetooth: MicrobitWebBluetoothConnection,
    private radioBridge: MicrobitRadioBridgeConnection
  ) {}

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

  connectMicrobitsSerial = async (deviceId: number): Promise<ConnectResult> => {
    if (!deviceId) {
      return ConnectResult.ManualConnectFailed;
    }
    this.radioBridge.setRemoteDeviceId(deviceId);
    const status = await this.radioBridge.connect();
    if (status === DeviceConnectionStatus.CONNECTED) {
      return ConnectResult.Success;
    }
    return ConnectResult.ManualConnectFailed;
  };

  connectBluetooth = async (
    name: string | undefined,
    clearDevice: boolean
  ): Promise<void> => {
    if (clearDevice) {
      await this.bluetooth.clearDevice();
    }
    if (name) {
      this.bluetooth.setNameFilter(name);
    }
    await this.bluetooth.connect();
  };

  addAccelerometerListener = (
    listener: (e: AccelerometerDataEvent) => void
  ) => {
    this.bluetooth.addEventListener("accelerometerdatachanged", listener);
    this.radioBridge.addEventListener("accelerometerdatachanged", listener);
  };

  removeAccelerometerListener = (
    listener: (e: AccelerometerDataEvent) => void
  ) => {
    this.bluetooth.removeEventListener("accelerometerdatachanged", listener);
    this.radioBridge.removeEventListener("accelerometerdatachanged", listener);
  };

  addButtonListener = (
    button: "A" | "B",
    listener: (e: ButtonEvent) => void
  ) => {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth.addEventListener(type, listener);
    this.radioBridge.addEventListener(type, listener);
  };

  removeButtonListener = (
    button: "A" | "B",
    listener: (e: ButtonEvent) => void
  ) => {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth.removeEventListener(type, listener);
    this.radioBridge.removeEventListener(type, listener);
  };

  disconnect = async () => {
    await this.bluetooth.disconnect();
    await this.radioBridge.disconnect();
  };

  addStatusListener = (listener: (e: ConnectionStatusEvent) => void) => {
    this.bluetooth.addEventListener("status", listener);
  };

  removeStatusListener = (listener: (e: ConnectionStatusEvent) => void) => {
    this.bluetooth.removeEventListener("status", listener);
  };
}

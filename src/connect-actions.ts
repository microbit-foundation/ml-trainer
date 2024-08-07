import {
  AccelerometerDataEvent,
  ConnectionStatusEvent,
  ButtonEvent,
  DeviceError,
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
  ConnectionStatus as DeviceConnectionStatus,
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

export interface StatusListeners {
  bluetooth: (e: ConnectionStatusEvent) => void;
  radioBridge: (e: ConnectionStatusEvent) => void;
  usb: (e: ConnectionStatusEvent) => void;
}

export type StatusListenerType = "bluetooth" | "radioRemote" | "usb";

export type StatusListener = (e: {
  status: DeviceConnectionStatus;
  type: StatusListenerType;
}) => void;

export class ConnectActions {
  private statusListeners: StatusListeners = {
    bluetooth: () => {},
    radioBridge: () => {},
    usb: () => {},
  };
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

  connectMicrobitsSerial = async (deviceId: number): Promise<void> => {
    this.radioBridge.setRemoteDeviceId(deviceId);
    await this.radioBridge.connect();
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

  private prepareStatusListeners = (
    listener: StatusListener
  ): StatusListeners => {
    return {
      bluetooth: (e) => listener({ status: e.status, type: "bluetooth" }),
      radioBridge: (e) => listener({ status: e.status, type: "radioRemote" }),
      usb: (e) => listener({ status: e.status, type: "usb" }),
    };
  };

  addStatusListener = (listener: StatusListener, connType: ConnectionType) => {
    const listeners = this.prepareStatusListeners(listener);
    if (connType === "bluetooth") {
      this.bluetooth.addEventListener("status", listeners.bluetooth);
      this.statusListeners.bluetooth = listeners.bluetooth;
    } else {
      this.radioBridge.addEventListener("status", listeners.radioBridge);
      this.statusListeners.radioBridge = listeners.radioBridge;
      this.usb.addEventListener("status", listeners.usb);
      this.statusListeners.usb = listeners.usb;
    }
  };

  removeStatusListener = () => {
    const listeners = this.statusListeners;
    this.bluetooth.removeEventListener("status", listeners.bluetooth);
    this.radioBridge.removeEventListener("status", listeners.radioBridge);
    this.usb.removeEventListener("status", listeners.usb);
  };
}

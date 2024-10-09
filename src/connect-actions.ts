import {
  AccelerometerDataEvent,
  BoardVersion,
  ButtonEvent,
  ConnectionStatus,
  ConnectionStatusEvent,
  ConnectionStatus as DeviceConnectionStatus,
  DeviceError,
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
  createUniversalHexFlashDataSource,
} from "@microbit/microbit-connection";
import { ConnectionType } from "./connection-stage-hooks";
import { HexType, getFlashDataSource } from "./device/get-hex-file";
import { Logging } from "./logging/logging";

export enum ConnectResult {
  Success = "Success",
  Failed = "Failed",
  ErrorMicrobitUnsupported = "ErrorMicrobitUnsupported",
  ErrorBadFirmware = "ErrorBadFirmware",
  ErrorNoDeviceSelected = "ErrorNoDeviceSelected",
  ErrorUnableToClaimInterface = "ErrorUnableToClaimInterface",
}

export type ConnectAndFlashFailResult = Exclude<
  ConnectResult,
  ConnectResult.Success
>;

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

export interface ConnectionAndFlashOptions {
  temporaryUsbConnection: MicrobitWebUSBConnection;
  callbackIfDeviceIsSame?: () => Promise<void>;
}

export class ConnectActions {
  private statusListeners: StatusListeners = {
    bluetooth: () => {},
    radioBridge: () => {},
    usb: () => {},
  };
  isWebBluetoothSupported: boolean;
  isWebUsbSupported: boolean;
  constructor(
    private logging: Logging,
    private usb: MicrobitWebUSBConnection,
    private bluetooth: MicrobitWebBluetoothConnection,
    private radioBridge: MicrobitRadioBridgeConnection,
    private radioRemoteBoardVersion: React.MutableRefObject<
      BoardVersion | undefined
    >
  ) {
    this.isWebBluetoothSupported =
      bluetooth.status !== DeviceConnectionStatus.NOT_SUPPORTED;
    this.isWebUsbSupported =
      usb.status !== DeviceConnectionStatus.NOT_SUPPORTED;
  }

  requestUSBConnection = async (
    // Used for MakeCode hex downloads.
    options?: ConnectionAndFlashOptions
  ): Promise<
    | {
        result: ConnectResult.Success;
        deviceId: number;
        usb: MicrobitWebUSBConnection;
      }
    | {
        result: ConnectAndFlashFailResult;
        deviceId?: number;
        usb?: MicrobitWebUSBConnection;
      }
  > => {
    const usb = options?.temporaryUsbConnection ?? this.usb;
    try {
      await usb.connect();
      // Save remote micro:bit device id is stored for passing it to bridge micro:bit
      const deviceId = usb.getDeviceId();
      if (
        options?.temporaryUsbConnection &&
        options?.callbackIfDeviceIsSame &&
        deviceId === this.usb.getDeviceId()
      ) {
        await options?.callbackIfDeviceIsSame();
      }
      if (!deviceId) {
        return { result: ConnectResult.Failed };
      }
      return { result: ConnectResult.Success, deviceId, usb };
    } catch (e) {
      this.logging.error(
        `USB request device failed/cancelled: ${JSON.stringify(e)}`
      );
      return { result: this.handleConnectAndFlashError(e) };
    }
  };

  flashMicrobit = async (
    hex: string | HexType,
    progress: (progress: number) => void,
    temporaryUsbConnection?: MicrobitWebUSBConnection
  ): Promise<ConnectResult> => {
    const usb = temporaryUsbConnection ?? this.usb;
    if (!usb) {
      return ConnectResult.Failed;
    }
    const data = Object.values(HexType).includes(hex as HexType)
      ? getFlashDataSource(hex as HexType)
      : createUniversalHexFlashDataSource(hex);

    if (!data) {
      return ConnectResult.ErrorMicrobitUnsupported;
    }
    try {
      await usb.flash(data, {
        partial: true,
        progress: (v: number | undefined) => progress(v ?? 100),
      });
      return ConnectResult.Success;
    } catch (e) {
      this.logging.error(`Flashing failed: ${JSON.stringify(e)}`);
      return ConnectResult.Failed;
    }
  };

  requestUSBConnectionAndFlash = async (
    hex: string | HexType,
    progressCallback: (progress: number) => void
  ): Promise<
    | {
        result: ConnectResult.Success;
        deviceId: number;
        boardVersion?: BoardVersion;
      }
    | {
        result: ConnectAndFlashFailResult;
        deviceId?: number;
        boardVersion?: BoardVersion;
      }
  > => {
    const { result, deviceId, usb } = await this.requestUSBConnection();
    if (result !== ConnectResult.Success) {
      return { result };
    }
    try {
      const result = await this.flashMicrobit(hex, progressCallback);
      return { result, deviceId, boardVersion: usb.getBoardVersion() };
    } catch (e) {
      this.logging.error(
        `USB request device failed/cancelled: ${JSON.stringify(e)}`
      );
      return { result: this.handleConnectAndFlashError(e) };
    }
  };

  private handleConnectAndFlashError = (
    err: unknown
  ): ConnectAndFlashFailResult => {
    if (err instanceof DeviceError) {
      switch (err.code) {
        case "clear-connect":
          return ConnectResult.ErrorUnableToClaimInterface;
        case "no-device-selected":
          return ConnectResult.ErrorNoDeviceSelected;
        case "update-req":
          return ConnectResult.ErrorBadFirmware;
        default:
          return ConnectResult.Failed;
      }
    }
    return ConnectResult.Failed;
  };

  connectMicrobitsSerial = async (
    deviceId: number,
    boardVersion?: BoardVersion
  ): Promise<void> => {
    this.radioRemoteBoardVersion.current = boardVersion;
    this.radioBridge.setRemoteDeviceId(deviceId);
    await this.radioBridge.connect();
  };

  getUsbDeviceId = () => {
    return this.usb.getDeviceId();
  };

  isUsbDeviceConnected = () => {
    return this.usb.status === ConnectionStatus.CONNECTED;
  };

  getUsbConnection = () => {
    return this.usb;
  };

  getBluetoothConnection = () => {
    return this.bluetooth;
  };

  getUsbDevice = () => {
    return this.usb.getDevice();
  };

  getDataCollectionBoardVersion = (): BoardVersion | undefined => {
    return (
      this.bluetooth.getBoardVersion() ?? this.radioRemoteBoardVersion.current
    );
  };

  clearUsbDevice = async () => {
    await this.usb.clearDevice();
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

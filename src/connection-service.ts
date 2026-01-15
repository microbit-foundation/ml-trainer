/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AccelerometerDataEvent,
  BoardVersion,
  ButtonEvent,
  ConnectionStatus,
  ConnectionStatusEvent,
  ConnectionStatus as DeviceConnectionStatus,
  DeviceError,
  FlashOptions,
  MicrobitRadioBridgeConnection,
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
  ProgressStage,
  createUniversalHexFlashDataSource,
} from "@microbit/microbit-connection";
import {
  ConnectionTransport,
  DataConnectionEvent,
  DataConnectionType,
} from "./data-connection-flow";
import { MicrobitConnection } from "./device/connection-utils";
import { HexType, getFlashDataSource } from "./device/get-hex-file";
import { Logging } from "./logging/logging";
import { isNativePlatform } from "./platform";

export enum ConnectResult {
  Success = "Success",
  Failed = "Failed",
  ErrorBadFirmware = "ErrorBadFirmware",
  ErrorNoDeviceSelected = "ErrorNoDeviceSelected",
  ErrorUnableToClaimInterface = "ErrorUnableToClaimInterface",
}

export type ConnectAndFlashFailResult = Exclude<
  ConnectResult,
  ConnectResult.Success
>;

type EventCallback = (event: DataConnectionEvent) => void;

export interface ConnectionAndFlashOptions {
  progress?: (stage: ProgressStage, value: number | undefined) => void;
}

/**
 * Wraps the micro:bit connection implementations and exposes an API used by
 * data collection and download flows. UI components should use those flows
 * instead of directly using this service.
 */
export class ConnectionService {
  constructor(
    private logging: Logging,
    private usb: MicrobitWebUSBConnection,
    private bluetooth: MicrobitWebBluetoothConnection,
    private radioBridge: MicrobitRadioBridgeConnection
  ) {}

  async initialize(): Promise<void> {
    await this.usb.initialize();
    await this.bluetooth.initialize();
    await this.radioBridge.initialize();
  }

  isWebBluetoothSupported(): boolean {
    return this.bluetooth.status !== DeviceConnectionStatus.NOT_SUPPORTED;
  }

  isWebUsbSupported(): boolean {
    return this.usb.status !== DeviceConnectionStatus.NOT_SUPPORTED;
  }

  getDefaultFlashConnection(): MicrobitConnection {
    return isNativePlatform() ? this.bluetooth : this.usb;
  }

  async connect(
    connection: MicrobitConnection,
    options?: ConnectionAndFlashOptions
  ): Promise<ConnectResult> {
    try {
      await connection.connect({ progress: options?.progress });
      return ConnectResult.Success;
    } catch (e) {
      this.logging.error("USB request device failed/cancelled", e);
      return this.handleConnectAndFlashError(e);
    }
  }

  async flash(
    connection: MicrobitConnection,
    hex: string | HexType,
    progress: (stage: ProgressStage, value: number | undefined) => void
  ): Promise<ConnectResult> {
    const data = Object.values(HexType).includes(hex as HexType)
      ? getFlashDataSource(hex as HexType)
      : createUniversalHexFlashDataSource(hex);

    try {
      const options: FlashOptions = {
        partial: true,
        // If we could improve the re-rendering due to progress further we can remove this and accept the
        // default which updates 4x as often.
        minimumProgressIncrement: 0.01,
        progress,
      };
      await connection.flash(data, options);
      return ConnectResult.Success;
    } catch (e) {
      this.logging.error("Flashing failed", e);
      return this.handleConnectAndFlashError(e);
    }
  }

  private handleConnectAndFlashError(err: unknown): ConnectAndFlashFailResult {
    if (err instanceof DeviceError) {
      switch (err.code) {
        case "clear-connect":
          return ConnectResult.ErrorUnableToClaimInterface;
        case "no-device-selected":
          return ConnectResult.ErrorNoDeviceSelected;
        case "update-req":
          return ConnectResult.ErrorBadFirmware;
        // TODO: There are now bluetooth related codes to add which need custom UX.
        default:
          return ConnectResult.Failed;
      }
    }
    return ConnectResult.Failed;
  }

  async connectMicrobitsSerial(deviceId: number): Promise<void> {
    this.radioBridge.setRemoteDeviceId(deviceId);
    await this.radioBridge.connect();
  }

  getUsbDeviceId(): number | undefined {
    return this.usb.getDeviceId();
  }

  isUsbDeviceConnected(): boolean {
    return this.usb.status === ConnectionStatus.CONNECTED;
  }

  getUsbBoardVersion(): BoardVersion | undefined {
    return this.usb.getBoardVersion();
  }

  getUsbDeviceSerialNumber(): string | undefined {
    return this.usb.getDevice()?.serialNumber;
  }

  getBluetoothBoardVersion(): BoardVersion | undefined {
    return this.bluetooth.getBoardVersion();
  }

  async clearUsbDevice(): Promise<void> {
    await this.usb.clearDevice();
  }

  async connectBluetooth(
    name: string | undefined,
    clearDevice: boolean
  ): Promise<ConnectResult> {
    if (clearDevice) {
      await this.bluetooth.clearDevice();
    }
    if (name) {
      this.bluetooth.setNameFilter(name);
    }
    try {
      await this.bluetooth.connect();
      return ConnectResult.Success;
    } catch (e) {
      this.logging.error("Bluetooth connect failed/cancelled", e);
      return this.handleConnectAndFlashError(e);
    }
  }

  addAccelerometerListener(
    listener: (e: AccelerometerDataEvent) => void
  ): void {
    this.bluetooth.addEventListener("accelerometerdatachanged", listener);
    this.radioBridge.addEventListener("accelerometerdatachanged", listener);
  }

  removeAccelerometerListener(
    listener: (e: AccelerometerDataEvent) => void
  ): void {
    this.bluetooth.removeEventListener("accelerometerdatachanged", listener);
    this.radioBridge.removeEventListener("accelerometerdatachanged", listener);
  }

  addButtonListener(
    button: "A" | "B",
    listener: (e: ButtonEvent) => void
  ): void {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth.addEventListener(type, listener);
    this.radioBridge.addEventListener(type, listener);
  }

  removeButtonListener(
    button: "A" | "B",
    listener: (e: ButtonEvent) => void
  ): void {
    const type = button === "A" ? "buttonachanged" : "buttonbchanged";
    this.bluetooth.removeEventListener(type, listener);
    this.radioBridge.removeEventListener(type, listener);
  }

  async disconnect(): Promise<void> {
    await this.bluetooth.disconnect();
    await this.radioBridge.disconnect();
  }

  private eventCallback: EventCallback | null = null;
  private prevDeviceStatus: DeviceConnectionStatus | null = null;
  private dataConnectionType: DataConnectionType =
    DataConnectionType.WebBluetooth;

  /**
   * Map device status to a state machine event.
   * Some events require checking the previous status to avoid false positives.
   */
  private mapDeviceStatusToEvent(
    deviceStatus: DeviceConnectionStatus
  ): DataConnectionEvent | null {
    // For radio connections, determine if disconnect is from bridge or remote.
    let disconnectSource: "bridge" | "remote" | undefined;
    if (
      this.dataConnectionType === DataConnectionType.Radio &&
      deviceStatus === DeviceConnectionStatus.DISCONNECTED
    ) {
      const usbConnected = this.isUsbDeviceConnected();
      disconnectSource = usbConnected ? "remote" : "bridge";
    }

    const prevStatus = this.prevDeviceStatus;

    switch (deviceStatus) {
      case DeviceConnectionStatus.CONNECTED:
        return { type: "deviceConnected" };
      case DeviceConnectionStatus.DISCONNECTED:
      case DeviceConnectionStatus.NO_AUTHORIZED_DEVICE:
        // Both DISCONNECTED and NO_AUTHORIZED_DEVICE mean "not connected".
        // Ignore transitions between these disconnected states (e.g., during
        // clearDevice() which goes DISCONNECTED → NO_AUTHORIZED_DEVICE).
        if (
          prevStatus === DeviceConnectionStatus.DISCONNECTED ||
          prevStatus === DeviceConnectionStatus.NO_AUTHORIZED_DEVICE
        ) {
          return null;
        }
        return { type: "deviceDisconnected", source: disconnectSource };
      case DeviceConnectionStatus.CONNECTING:
        return { type: "deviceConnecting" };
      case DeviceConnectionStatus.RECONNECTING:
        return { type: "deviceReconnecting" };
      case DeviceConnectionStatus.PAUSED:
        // Connection paused due to tab visibility - will reconnect automatically.
        return { type: "devicePaused" };
      default:
        return null;
    }
  }

  private handleStatusChange = (
    connectionStatusEvent: ConnectionStatusEvent
  ): void => {
    const deviceStatus = connectionStatusEvent.status;
    const event = this.mapDeviceStatusToEvent(deviceStatus);
    this.prevDeviceStatus = deviceStatus;

    if (event && this.eventCallback) {
      this.eventCallback(event);
    }
  };

  /**
   * Set the callback that will be invoked with mapped DataConnectionEvents.
   * Must be called before startListening().
   */
  setEventCallback(callback: EventCallback): void {
    this.eventCallback = callback;
  }

  /**
   * Start listening for device status events.
   * Removes any existing listener first to avoid duplicates.
   */
  startListening(
    connType: ConnectionTransport,
    dataConnectionType: DataConnectionType
  ): void {
    if (!this.eventCallback) {
      throw new Error("Event callback not set. Call setEventCallback first.");
    }
    // Remove any existing listener first
    this.stopListening();

    this.dataConnectionType = dataConnectionType;

    if (connType === "bluetooth") {
      // Initialize to current status so we correctly detect transitions
      this.prevDeviceStatus = this.bluetooth.status;
      this.bluetooth.addEventListener("status", this.handleStatusChange);
    } else {
      // For radio connections, only listen to radioBridge status.
      // The radioBridge propagates USB connection issues via its delegateStatusListener,
      // so we don't need a separate USB listener. This also avoids the USB CONNECTED
      // event firing before the radioBridge has verified the remote micro:bit responds.
      this.prevDeviceStatus = this.radioBridge.status;
      this.radioBridge.addEventListener("status", this.handleStatusChange);
    }
  }

  /**
   * Stop listening for device status events.
   */
  stopListening(): void {
    this.bluetooth.removeEventListener("status", this.handleStatusChange);
    this.radioBridge.removeEventListener("status", this.handleStatusChange);
  }
}

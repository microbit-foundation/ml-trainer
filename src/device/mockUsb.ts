import {
  BoardVersion,
  ConnectOptions,
  ConnectionAvailabilityStatus,
  ConnectionStatus,
  DeviceError,
  FlashDataSource,
  FlashOptions,
  ProgressStage,
} from "@microbit/microbit-connection";
import { MicrobitUSBConnection } from "@microbit/microbit-connection/usb";
import { MockEventTarget } from "./mockEventTarget";

/**
 * A mock USB connection used during end-to-end testing.
 */
export class MockUSBConnection
  extends MockEventTarget
  implements MicrobitUSBConnection
{
  readonly type = "usb" as const;
  status: ConnectionStatus = ConnectionStatus.NoAuthorizedDevice;

  /**
   * Whether a successful connection has occurred.
   * Mirrors the real implementation where getBoardVersion()/getDeviceId()
   * cache values after the first successful connection.
   */
  private hasConnected = false;

  private fakeDeviceId: number | undefined = 123;

  constructor() {
    super();
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockUsb = this;
    this.fakeDeviceId = Math.round(Math.random() * 1000);
  }
  async initialize(): Promise<void> {}

  checkAvailability(): Promise<ConnectionAvailabilityStatus> {
    return Promise.resolve("available");
  }

  dispose(): void {}

  mockDeviceId(deviceId: number | undefined) {
    this.fakeDeviceId = deviceId;
  }

  private setStatus(newStatus: ConnectionStatus) {
    const previousStatus = this.status;
    this.status = newStatus;
    this.dispatchEvent("status", {
      status: newStatus,
      previousStatus,
    });
  }

  async connect(options?: ConnectOptions): Promise<void> {
    const progress = options?.progress;

    // Report FindingDevice stage before showing browser device picker
    progress?.(ProgressStage.FindingDevice);
    this.dispatchEvent("beforerequestdevice");
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.dispatchEvent("afterrequestdevice");

    // Simulate "no device selected" error when fakeDeviceId is undefined
    // Real implementation sets DISCONNECTED and throws when user cancels device dialog
    if (this.fakeDeviceId === undefined) {
      this.setStatus(ConnectionStatus.Disconnected);
      throw new DeviceError({
        code: "no-device-selected",
        message: "No device selected",
      });
    }

    // Report Connecting stage after device selected
    progress?.(ProgressStage.Connecting);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.Connected);
    this.hasConnected = true;
  }

  private assertConnected(): void {
    if (!this.hasConnected) {
      throw new DeviceError({
        code: "not-connected",
        message: "Not connected",
      });
    }
  }

  getDeviceId(): number {
    this.assertConnected();
    return this.fakeDeviceId ?? 0;
  }

  getBoardVersion(): BoardVersion {
    this.assertConnected();
    return "V2";
  }

  async flash(
    _dataSource: FlashDataSource,
    options: FlashOptions = {}
  ): Promise<void> {
    const stage: ProgressStage =
      options.partial === undefined || options.partial
        ? ProgressStage.PartialFlashing
        : ProgressStage.FullFlashing;
    await new Promise((resolve) => setTimeout(resolve, 100));
    options.progress?.(stage, 50);
    await new Promise((resolve) => setTimeout(resolve, 100));
    options.progress?.(stage, undefined);
    this.dispatchEvent("flash");
  }

  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}

  /**
   * Simulate the USB device disconnecting unexpectedly.
   * This triggers the app's error handling for USB connection loss.
   */
  simulateDisconnect() {
    this.setStatus(ConnectionStatus.Disconnected);
  }

  /**
   * Simulate the USB device being reconnected (e.g., user plugs it back in).
   * This sets status to CONNECTED without going through the connect flow.
   */
  simulateReconnect() {
    this.setStatus(ConnectionStatus.Connected);
  }

  clearDevice(): void {
    this.fakeDeviceId = undefined;
    this.hasConnected = false;
    this.setStatus(ConnectionStatus.NoAuthorizedDevice);
  }

  setRequestDeviceExclusionFilters(
    _exclusionFilters: USBDeviceFilter[]
  ): void {}
  getDevice(): USBDevice | undefined {
    return undefined;
  }
  async softwareReset(): Promise<void> {}
}

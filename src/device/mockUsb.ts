import {
  AfterRequestDevice,
  BeforeRequestDevice,
  BoardVersion,
  ConnectOptions,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceError,
  FlashDataSource,
  FlashEvent,
  FlashOptions,
  MicrobitWebUSBConnection,
  ProgressStage,
  SerialConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";

/**
 * A mock USB connection used during end-to-end testing.
 */
export class MockWebUSBConnection
  extends TypedEventTarget<DeviceConnectionEventMap & SerialConnectionEventMap>
  implements MicrobitWebUSBConnection
{
  status: ConnectionStatus = ConnectionStatus.NO_AUTHORIZED_DEVICE;

  private fakeDeviceId: number | undefined = 123;

  constructor() {
    super();
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockUsb = this;
    this.fakeDeviceId = Math.round(Math.random() * 1000);
  }
  async initialize(): Promise<void> {}
  dispose(): void {}

  mockDeviceId(deviceId: number | undefined) {
    this.fakeDeviceId = deviceId;
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async connect(options?: ConnectOptions): Promise<void> {
    const progress = options?.progress;

    // Report FindingDevice stage before showing browser device picker
    progress?.(ProgressStage.FindingDevice);
    this.dispatchTypedEvent("beforerequestdevice", new BeforeRequestDevice());
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.dispatchTypedEvent("afterrequestdevice", new AfterRequestDevice());

    // Simulate "no device selected" error when fakeDeviceId is undefined
    // Real implementation sets DISCONNECTED and throws when user cancels device dialog
    if (this.fakeDeviceId === undefined) {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      throw new DeviceError({
        code: "no-device-selected",
        message: "No device selected",
      });
    }

    // Report Connecting stage after device selected
    progress?.(ProgressStage.Connecting);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.CONNECTED);
  }

  getDeviceId(): number | undefined {
    return this.fakeDeviceId;
  }

  getBoardVersion(): BoardVersion | undefined {
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
    this.dispatchTypedEvent("flash", new FlashEvent());
  }

  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}

  /**
   * Simulate the USB device disconnecting unexpectedly.
   * This triggers the app's error handling for USB connection loss.
   */
  simulateDisconnect() {
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Simulate the USB device being reconnected (e.g., user plugs it back in).
   * This sets status to CONNECTED without going through the connect flow.
   */
  simulateReconnect() {
    this.setStatus(ConnectionStatus.CONNECTED);
  }

  clearDevice(): void {
    this.fakeDeviceId = undefined;
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
  }

  setRequestDeviceExclusionFilters(
    _exclusionFilters: USBDeviceFilter[]
  ): void {}
  getDevice(): USBDevice | undefined {
    return undefined;
  }
  async softwareReset(): Promise<void> {}
}

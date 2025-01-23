import {
  AfterRequestDevice,
  BeforeRequestDevice,
  BoardVersion,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceWebUSBConnection,
  FlashDataSource,
  FlashEvent,
  FlashOptions,
  TypedEventTarget,
} from "@microbit/microbit-connection";

/**
 * A mock USB connection used during end-to-end testing.
 */
export class MockWebUSBConnection
  extends TypedEventTarget<DeviceConnectionEventMap>
  implements DeviceWebUSBConnection
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
    console.log("usb", newStatus);
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async connect(): Promise<ConnectionStatus> {
    this.dispatchTypedEvent("beforerequestdevice", new BeforeRequestDevice());
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.dispatchTypedEvent("afterrequestdevice", new AfterRequestDevice());
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.CONNECTED);
    return this.status;
  }

  getDeviceId(): number | undefined {
    return this.fakeDeviceId;
  }

  getBoardVersion(): BoardVersion | undefined {
    return "V2";
  }

  async flash(
    _dataSource: FlashDataSource,
    options: FlashOptions
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    options.progress(50, options.partial);
    await new Promise((resolve) => setTimeout(resolve, 100));
    options.progress(undefined, options.partial);
    this.dispatchTypedEvent("flash", new FlashEvent());
  }

  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}

  clearDevice(): void {
    this.fakeDeviceId = undefined;
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
  }
}

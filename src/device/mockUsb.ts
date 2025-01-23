import {
  AfterRequestDevice,
  BeforeRequestDevice,
  BoardVersion,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceWebUSBConnection,
  FlashDataSource,
  FlashOptions,
  TypedEventTarget,
} from "@microbit/microbit-connection";

export class MockWebUSBConnection
  extends TypedEventTarget<DeviceConnectionEventMap>
  implements DeviceWebUSBConnection
{
  status: ConnectionStatus = ConnectionStatus.NO_AUTHORIZED_DEVICE;

  async initialize(): Promise<void> {}
  dispose(): void {}

  private mockStatus(newStatus: ConnectionStatus) {
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async connect(): Promise<ConnectionStatus> {
    this.dispatchTypedEvent("beforerequestdevice", new BeforeRequestDevice());
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.dispatchTypedEvent("afterrequestdevice", new AfterRequestDevice());
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.mockStatus(ConnectionStatus.CONNECTED);
    return ConnectionStatus.CONNECTED;
  }
  getDeviceId(): number | undefined {
    const fakeDeviceId = 123;
    return fakeDeviceId;
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
  }
  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}
  clearDevice(): void {}
}

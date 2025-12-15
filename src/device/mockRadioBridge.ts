import {
  BoardVersion,
  ConnectOptions,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  MicrobitRadioBridgeConnection,
  MicrobitWebUSBConnection,
  ServiceConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";

export class MockRadioBridgeConnection
  extends TypedEventTarget<DeviceConnectionEventMap & ServiceConnectionEventMap>
  implements MicrobitRadioBridgeConnection
{
  status: ConnectionStatus;

  constructor(private delegate: MicrobitWebUSBConnection) {
    super();
    this.status = this.statusFromDelegate();
  }

  private statusFromDelegate(): ConnectionStatus {
    return this.delegate.status == ConnectionStatus.CONNECTED
      ? ConnectionStatus.DISCONNECTED
      : this.delegate.status;
  }

  async initialize(): Promise<void> {}
  dispose(): void {}
  setRemoteDeviceId(_deviceId: number): void {}
  async disconnect(): Promise<void> {}

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async connect(options?: ConnectOptions): Promise<void> {
    await this.delegate.connect(options);
    this.setStatus(ConnectionStatus.CONNECTING);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.CONNECTED);
  }

  getBoardVersion(): BoardVersion | undefined {
    return this.delegate.getBoardVersion();
  }

  serialWrite(data: string): Promise<void> {
    return this.delegate.serialWrite(data);
  }
  async clearDevice(): Promise<void> {
    await this.delegate.clearDevice();
  }
}

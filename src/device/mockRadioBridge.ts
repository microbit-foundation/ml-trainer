import {
  BoardVersion,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceRadioBridgeConnection,
  MicrobitWebUSBConnection,
  TypedEventTarget,
} from "@microbit/microbit-connection";

export class MockRadioBridgeConnection
  extends TypedEventTarget<DeviceConnectionEventMap>
  implements DeviceRadioBridgeConnection
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

  async connect(): Promise<ConnectionStatus> {
    await this.delegate.connect();
    this.setStatus(ConnectionStatus.CONNECTING);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.CONNECTED);
    return this.status;
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

import {
  BoardVersion,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceWebBluetoothConnection,
  TypedEventTarget,
} from "@microbit/microbit-connection";

export class MockWebBluetoothConnection
  extends TypedEventTarget<DeviceConnectionEventMap>
  implements DeviceWebBluetoothConnection
{
  status: ConnectionStatus = ConnectionStatus.NO_AUTHORIZED_DEVICE;

  async initialize(): Promise<void> {}
  dispose(): void {}

  private mockStatus(newStatus: ConnectionStatus) {
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async connect(): Promise<ConnectionStatus> {
    this.mockStatus(ConnectionStatus.CONNECTING);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.mockStatus(ConnectionStatus.CONNECTED);
    return ConnectionStatus.CONNECTED;
  }
  getBoardVersion(): BoardVersion | undefined {
    return "V2";
  }
  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}

  clearDevice(): void {}
  setNameFilter(_name: string): void {}
}

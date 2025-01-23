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
  private connectResults: ConnectionStatus[] = [];

  constructor() {
    super();
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockBluetooth = this;
  }
  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    console.log("bluetooth", newStatus);
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  async initialize(): Promise<void> {
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  dispose(): void {}

  mockConnectResults(results: ConnectionStatus[]) {
    this.connectResults = results;
  }

  async connect(): Promise<ConnectionStatus> {
    if (this.connectResults.length > 0) {
      for (const result of this.connectResults) {
        this.setStatus(result);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.status;
    }
    this.setStatus(ConnectionStatus.CONNECTING);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.setStatus(ConnectionStatus.CONNECTED);
    return this.status;
  }

  getBoardVersion(): BoardVersion | undefined {
    return "V2";
  }

  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}
  setNameFilter(_name: string): void {}

  clearDevice(): void {
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
  }
}

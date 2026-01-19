import {
  BoardVersion,
  ConnectOptions,
  ConnectionAvailabilityStatus,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  MicrobitRadioBridgeConnection,
  MicrobitWebUSBConnection,
  ServiceConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";
import { ConnectBehavior } from "./mockBluetooth";

/**
 * A mock Radio Bridge connection used during end-to-end testing.
 *
 * This mock wraps a USB connection and simulates the radio bridge behavior.
 * The USB connection is used for initial setup (flashing the bridge program),
 * then radio communication is established with the remote micro:bit.
 */
export class MockRadioBridgeConnection
  extends TypedEventTarget<DeviceConnectionEventMap & ServiceConnectionEventMap>
  implements MicrobitRadioBridgeConnection
{
  status: ConnectionStatus;

  /**
   * Queue of behaviors for subsequent connect() calls.
   */
  private connectBehaviors: ConnectBehavior[] = [];

  /**
   * Delay between status changes in ms.
   */
  private statusDelay = 50;

  /**
   * Listener for delegate (USB) status changes.
   * Like the real implementation, we propagate USB disconnects.
   */
  private delegateStatusListener = (e: ConnectionStatusEvent) => {
    // Propagate USB disconnects to the radio bridge status.
    // This simulates the real behavior where USB issues are propagated
    // through the delegateStatusListener.
    if (e.status === ConnectionStatus.DISCONNECTED) {
      this.setStatus(ConnectionStatus.DISCONNECTED);
    }
  };

  constructor(private delegate: MicrobitWebUSBConnection) {
    super();
    this.status = this.statusFromDelegate();
    // Listen for delegate (USB) status changes
    this.delegate.addEventListener("status", this.delegateStatusListener);
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockRadioBridge = this;
  }

  private statusFromDelegate(): ConnectionStatus {
    return this.delegate.status == ConnectionStatus.CONNECTED
      ? ConnectionStatus.DISCONNECTED
      : this.delegate.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    const previousStatus = this.status;
    this.status = newStatus;
    this.dispatchTypedEvent(
      "status",
      new ConnectionStatusEvent(newStatus, previousStatus)
    );
  }

  private delay(ms: number = this.statusDelay): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set behaviors for subsequent connect() calls.
   * Each behavior is consumed in order. When empty, defaults to success via delegate.
   */
  setConnectBehaviors(behaviors: ConnectBehavior[]) {
    this.connectBehaviors = [...behaviors];
  }

  /**
   * Simulate the device disconnecting unexpectedly.
   */
  simulateDisconnect() {
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Set the delay between status changes (default: 50ms).
   */
  setStatusDelay(ms: number) {
    this.statusDelay = ms;
  }

  async initialize(): Promise<void> {}

  async checkAvailability(): Promise<ConnectionAvailabilityStatus> {
    return this.delegate.checkAvailability();
  }

  dispose(): void {}
  setRemoteDeviceId(_deviceId: number): void {}
  async disconnect(): Promise<void> {}

  async connect(options?: ConnectOptions): Promise<void> {
    const behavior = this.connectBehaviors.shift();

    if (behavior) {
      // Use configured behavior
      switch (behavior.outcome) {
        case "success":
          this.setStatus(ConnectionStatus.CONNECTING);
          await this.delay();
          this.setStatus(ConnectionStatus.CONNECTED);
          await this.delay();
          break;

        case "failure":
          this.setStatus(ConnectionStatus.CONNECTING);
          await this.delay();
          this.setStatus(behavior.status);
          await this.delay();
          break;

        case "noDevice":
          // For radio bridge, delegate to USB for device selection
          await this.delegate.connect(options);
          break;
      }
    } else {
      // Default behavior: connect via delegate, then establish radio link
      await this.delegate.connect(options);
      this.setStatus(ConnectionStatus.CONNECTING);
      await this.delay();
      this.setStatus(ConnectionStatus.CONNECTED);
      await this.delay();
    }
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

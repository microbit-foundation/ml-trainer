import {
  BoardVersion,
  ConnectOptions,
  ConnectionAvailabilityStatus,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceError,
  FlashDataSource,
  FlashOptions,
  LedMatrix,
  MicrobitWebBluetoothConnection,
  ProgressStage,
  ServiceConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";

/**
 * Describes the outcome of a connect() call.
 *
 * - 'success': Fires CONNECTING -> CONNECTED
 * - 'failure': Fires CONNECTING -> specified status (e.g., DISCONNECTED)
 * - 'noDevice': Fires NO_AUTHORIZED_DEVICE and throws DeviceError
 * - 'error': Throws DeviceError with the specified code (e.g., 'disabled', 'permission-denied')
 */
export type ConnectBehavior =
  | { outcome: "success" }
  | { outcome: "failure"; status: ConnectionStatus }
  | { outcome: "noDevice" }
  | { outcome: "error"; code: string };

/**
 * A mock Bluetooth connection used during end-to-end testing.
 *
 * Usage in e2e tests:
 *
 * ```typescript
 * // Configure what happens on subsequent connect() calls
 * await page.evaluate(() => {
 *   window.mockBluetooth.setConnectBehaviors([
 *     { outcome: 'failure', status: ConnectionStatus.DISCONNECTED },
 *     { outcome: 'success' },
 *   ]);
 * });
 *
 * // Simulate device disconnecting
 * await page.evaluate(() => window.mockBluetooth.simulateDisconnect());
 * ```
 */
export class MockWebBluetoothConnection
  extends TypedEventTarget<DeviceConnectionEventMap & ServiceConnectionEventMap>
  implements MicrobitWebBluetoothConnection
{
  status: ConnectionStatus = ConnectionStatus.NO_AUTHORIZED_DEVICE;

  /**
   * Queue of behaviors for subsequent connect() calls.
   * Each call to connect() shifts one behavior from this queue.
   * When empty, defaults to success.
   */
  private connectBehaviors: ConnectBehavior[] = [];

  /**
   * What checkAvailability() returns. Defaults to "available".
   */
  private availabilityStatus: ConnectionAvailabilityStatus = "available";

  /**
   * Delay between status changes in ms. Shorter = faster tests.
   */
  private statusDelay = 50;

  constructor() {
    super();
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockBluetooth = this;
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(newStatus));
  }

  private delay(ms: number = this.statusDelay): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set behaviors for subsequent connect() calls.
   * Each behavior is consumed in order. When empty, defaults to success.
   *
   * Example:
   * ```typescript
   * // First connect fails, second succeeds
   * mock.setConnectBehaviors([
   *   { outcome: 'failure', status: ConnectionStatus.DISCONNECTED },
   *   { outcome: 'success' },
   * ]);
   * ```
   */
  setConnectBehaviors(behaviors: ConnectBehavior[]) {
    this.connectBehaviors = [...behaviors];
  }

  /**
   * Set what checkAvailability() returns.
   * Used to test permission error scenarios in the native Bluetooth flow.
   *
   * Example:
   * ```typescript
   * // Simulate Bluetooth being disabled
   * mock.setAvailabilityStatus('disabled');
   * ```
   */
  setAvailabilityStatus(status: ConnectionAvailabilityStatus) {
    this.availabilityStatus = status;
  }

  /**
   * Simulate the device disconnecting unexpectedly.
   * This fires a DISCONNECTED status event, which the app's status listener
   * will pick up and potentially trigger reconnection logic.
   */
  simulateDisconnect() {
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Set the delay between status changes (default: 50ms).
   * Shorter delays make tests faster but may cause timing issues.
   */
  setStatusDelay(ms: number) {
    this.statusDelay = ms;
  }

  async initialize(): Promise<void> {
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
    await this.delay(100);
  }

  dispose(): void {}

  checkAvailability(): Promise<ConnectionAvailabilityStatus> {
    return Promise.resolve(this.availabilityStatus);
  }

  async connect(_options?: ConnectOptions): Promise<void> {
    const behavior = this.connectBehaviors.shift() ?? { outcome: "success" };

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
        this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
        throw new DeviceError({
          code: "no-device-selected",
          message: "No device selected",
        });

      case "error":
        throw new DeviceError({
          code: behavior.code,
          message: `Mock error: ${behavior.code}`,
        });
    }
  }

  getBoardVersion(): BoardVersion | undefined {
    return "V2";
  }

  async disconnect(): Promise<void> {}
  async serialWrite(_data: string): Promise<void> {}
  setNameFilter(_name: string): void {}

  async flash(
    _dataSource: FlashDataSource,
    options: FlashOptions = {}
  ): Promise<void> {
    const progress = options.progress;
    const stage = ProgressStage.PartialFlashing;

    // Simulate flashing progress
    progress?.(stage, 0.25);
    await this.delay();
    progress?.(stage, 0.5);
    await this.delay();
    progress?.(stage, 0.75);
    await this.delay();
    progress?.(stage, undefined);

    // Real Bluetooth flash disconnects after completion
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  async clearDevice(): Promise<void> {
    // Real implementation calls disconnect() which fires DISCONNECTED,
    // then fires NO_AUTHORIZED_DEVICE
    this.setStatus(ConnectionStatus.DISCONNECTED);
    await this.delay();
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
  }

  async getAccelerometerData(): Promise<undefined> {}
  async getAccelerometerPeriod(): Promise<undefined> {}
  async setAccelerometerPeriod(_value: number): Promise<void> {}
  async setLedText(_text: string): Promise<void> {}
  async getLedScrollingDelay(): Promise<undefined> {}
  async setLedScrollingDelay(_delayInMillis: number): Promise<void> {}
  async getLedMatrix(): Promise<undefined> {}
  async setLedMatrix(_matrix: LedMatrix): Promise<void> {}
  async getMagnetometerData(): Promise<undefined> {}
  async getMagnetometerBearing(): Promise<undefined> {}
  async getMagnetometerPeriod(): Promise<undefined> {}
  async setMagnetometerPeriod(_value: number): Promise<void> {}
  async triggerMagnetometerCalibration(): Promise<void> {}
  async uartWrite(_data: Uint8Array): Promise<void> {}
}

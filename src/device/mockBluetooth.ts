import {
  BoardVersion,
  ConnectOptions,
  ConnectionAvailabilityStatus,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  DeviceError,
  DeviceErrorCode,
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
  | { outcome: "error"; code: DeviceErrorCode };

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

  /**
   * If set, connect()/flash() will pause at this stage/progress.
   * Call resumeProgress() to continue.
   */
  private progressPauseAt:
    | { stage: ProgressStage; progress: number | undefined }
    | undefined;

  /**
   * Resolver to continue after pause.
   */
  private progressResolve: (() => void) | undefined;

  constructor() {
    super();
    // Make globally available to allow e2e tests to configure interactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).mockBluetooth = this;
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

  /**
   * Configure connect()/flash() to pause at a specific stage/progress for screenshots.
   * Call resumeProgress() to continue.
   *
   * @param stage - The ProgressStage to pause at
   * @param progress - The progress value (0-1) or undefined for indeterminate
   *
   * Example:
   * ```typescript
   * // Pause at 50% flashing progress
   * mock.setProgressPauseAt(ProgressStage.PartialFlashing, 0.5);
   * // ... trigger connect/flash, take screenshot ...
   * mock.resumeProgress();
   * ```
   */
  setProgressPauseAt(
    stage: ProgressStage | undefined,
    progress: number | undefined
  ) {
    this.progressPauseAt = stage ? { stage, progress } : undefined;
  }

  /**
   * Resume after pause set by setProgressPauseAt().
   */
  resumeProgress() {
    this.progressResolve?.();
    this.progressResolve = undefined;
  }

  async initialize(): Promise<void> {
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
    await this.delay(100);
  }

  dispose(): void {}

  checkAvailability(): Promise<ConnectionAvailabilityStatus> {
    return Promise.resolve(this.availabilityStatus);
  }

  async connect(options?: ConnectOptions): Promise<void> {
    const behavior = this.connectBehaviors.shift() ?? { outcome: "success" };
    const progress = options?.progress;

    switch (behavior.outcome) {
      case "success":
        await this.progressStage(
          progress,
          ProgressStage.FindingDevice,
          undefined
        );
        this.setStatus(ConnectionStatus.CONNECTING);
        await this.progressStage(progress, ProgressStage.Connecting, undefined);
        this.setStatus(ConnectionStatus.CONNECTED);
        await this.delay();
        break;

      case "failure":
        await this.progressStage(
          progress,
          ProgressStage.FindingDevice,
          undefined
        );
        this.setStatus(ConnectionStatus.CONNECTING);
        await this.progressStage(progress, ProgressStage.Connecting, undefined);
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

  private async progressStage(
    progressCallback: FlashOptions["progress"],
    stage: ProgressStage,
    progress: number | undefined
  ): Promise<void> {
    progressCallback?.(stage, progress);
    // Check if we should pause at this point
    if (
      this.progressPauseAt?.stage === stage &&
      this.progressPauseAt?.progress === progress
    ) {
      await new Promise<void>((resolve) => {
        this.progressResolve = resolve;
      });
    } else {
      await this.delay();
    }
  }

  async flash(
    _dataSource: FlashDataSource,
    options: FlashOptions = {}
  ): Promise<void> {
    const progress = options.progress;

    // Simulate full flash sequence with all stages
    await this.progressStage(progress, ProgressStage.Connecting, undefined);
    await this.progressStage(progress, ProgressStage.PartialFlashing, 0.25);
    await this.progressStage(progress, ProgressStage.PartialFlashing, 0.5);
    await this.progressStage(progress, ProgressStage.PartialFlashing, 0.75);
    await this.progressStage(
      progress,
      ProgressStage.PartialFlashing,
      undefined
    );

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
  async abortDeviceScan(): Promise<void> {}
}

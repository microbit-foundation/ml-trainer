import {
  AccelerometerData,
  BoardVersion,
  ConnectionStatus,
  ConnectionStatusEvent,
  DeviceConnectionEventMap,
  FlashDataError,
  FlashDataSource,
  LedMatrix,
  MagnetometerData,
  MicrobitWebBluetoothConnection,
  ServiceConnectionEventMap,
  TypedEventTarget,
} from "@microbit/microbit-connection";
import {
  BluetoothInitializationResult,
  connectHandlingBond,
  Device,
  findMatchingDevice,
  initializeBluetooth,
} from "./bluetooth";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { DeviceInformationService } from "./device-information-service";
import MemoryMap from "nrf-intel-hex";
import partialFlash, { PartialFlashResult } from "./flashing-partial";
import { fullFlash } from "./flashing-full";
import { FlashResult } from "./model";
import { AccelerometerService } from "./acceleromoeter-service";

export class MicrobitCapacitorBluetoothConnection
  extends TypedEventTarget<DeviceConnectionEventMap & ServiceConnectionEventMap>
  implements MicrobitWebBluetoothConnection
{
  status: ConnectionStatus = ConnectionStatus.NO_AUTHORIZED_DEVICE;
  private deviceName: string | undefined;
  private device: Device | undefined;
  private boardVersion: BoardVersion | undefined;
  private accelerometerService: AccelerometerService | undefined;

  // Subset needed for CreateAI

  setNameFilter(name: string): void {
    this.deviceName = name;
  }

  async initialize(): Promise<void> {
    // We do this on connect as we can't tell support on a one-off basis.
  }

  dispose(): void {
    // Nothing to do.
  }

  async connect(): Promise<ConnectionStatus> {
    this.setStatus(await this.connectInternal());
    return this.status;
  }

  private async connectInternal(): Promise<ConnectionStatus> {
    this.log("Connecting");
    // TODO: errors handling.
    if (!this.device) {
      this.log("No existing device; initializing");
      // TODO: can this be called repeatedly? presumably permissions can change?!
      const initialiseResult = await initializeBluetooth();
      this.log(`Initialization result ${initialiseResult}`);
      switch (initialiseResult) {
        case BluetoothInitializationResult.BluetoothDisabled: {
          return ConnectionStatus.NOT_SUPPORTED;
        }
        case BluetoothInitializationResult.MissingPermissions: {
          return ConnectionStatus.NOT_SUPPORTED;
        }
        default: {
          break;
        }
      }

      this.log(`Finding device matching ${this.deviceName}`);
      const bleDevice = await findMatchingDevice(
        // TODO: there's an interesting case in the web bluetooth code to add here.
        this.deviceName ? `BBC micro:bit [${this.deviceName}]` : "BBC micro:bit"
      );
      if (!bleDevice) {
        return ConnectionStatus.NO_AUTHORIZED_DEVICE;
      }
      this.device = new Device(bleDevice.deviceId, this.deviceName);
      if (await connectHandlingBond(this.device)) {
        // Refresh services before using characteristics.
        await BleClient.discoverServices(this.device.deviceId);

        const deviceInformationService = new DeviceInformationService(
          this.device
        );
        this.boardVersion = await deviceInformationService.getBoardVersion();
        this.device.log(`Detected micro:bit version as ${this.boardVersion}`);
        this.handleConnected();
        return ConnectionStatus.CONNECTED;
      }
      return ConnectionStatus.DISCONNECTED;
    } else {
      console.log("Reconnecting");
      await this.device.connect("reconnect");
      this.handleConnected();
      return ConnectionStatus.CONNECTED;
    }
  }

  private handleConnected() {
    if (this.device) {
      void this.device.disconnectTracker?.promise.then(() => {
        this.setStatus(ConnectionStatus.DISCONNECTED);
      });
      if (this.getActiveEvents().includes("accelerometerdatachanged")) {
        // TODO: background error
        void this.accelerometerService?.startNotifications();
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.device?.disconnect();
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  getBoardVersion(): BoardVersion | undefined {
    return this.boardVersion;
  }

  async clearDevice(): Promise<void> {
    await this.disconnect();
    this.device = undefined;
    this.boardVersion = undefined;
    this.setStatus(ConnectionStatus.NO_AUTHORIZED_DEVICE);
  }

  protected eventActivated(_type: string): void {
    // TODO: merge with the notification bookkeeping in bluetooth.ts
    if (_type === "accelerometerdatachanged") {
      if (this.device) {
        if (!this.accelerometerService) {
          this.accelerometerService = new AccelerometerService(
            this.device,
            this.dispatchTypedEvent.bind(this)
          );
        }
        // TODO: handle background error
        void this.accelerometerService.startNotifications();
      }
    }
  }

  protected eventDeactivated(_type: string): void {
    // TODO: merge with the notification bookkeeping in bluetooth.ts
    if (_type === "accelerometerdatachanged") {
      if (this.device) {
        // TODO: handle background error
        void this.accelerometerService?.stopNotifications();
      }
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.dispatchTypedEvent("status", new ConnectionStatusEvent(status));
  }

  // Extra API, matching USB case

  /**
   * Flash the micro:bit.
   *
   * Note that this will always leave the connection disconnected.
   *
   * @param dataSource The data to use.
   * @param options Flash options and progress callback.
   */
  async flash(dataSource: FlashDataSource): Promise<void> {
    const progress = () => {
      // TODO!
    };
    if (this.status !== ConnectionStatus.CONNECTED) {
      // Don't immediately update the status when connecting just for flashing
      // as we're going to disconnect anyway and the rest of the app doesn't care
      const status = await this.connectInternal();
      if (status !== ConnectionStatus.CONNECTED) {
        throw new Error(`Failed to connect ${status}`);
      }
    }

    try {
      const memoryMap = convertDataToMemoryMap(
        await dataSource(this.getBoardVersion()!)
      );
      if (!memoryMap) {
        throw new FlashDataError();
      }

      if (!this.device || !this.boardVersion) {
        throw new Error();
      }
      const partialFlashResult = await partialFlash(
        this.device,
        memoryMap,
        progress
      );

      switch (partialFlashResult) {
        case PartialFlashResult.Success: {
          return;
        }
        case PartialFlashResult.Failed: {
          throw new Error("Partial flash failed");
        }
        case PartialFlashResult.AttemptFullFlash: {
          const fullFlashResult = await fullFlash(
            this.device,
            this.boardVersion,
            memoryMap,
            progress
          );
          // TODO: get a grip on this return value
          if (fullFlashResult !== FlashResult.Success) {
            throw new Error();
          }
          return;
        }
        default: {
          throw new Error("Unexpected");
        }
      }
    } catch (e) {
      this.log("Failed to flash");
      this.error(e);
      throw e;
    } finally {
      await this.disconnect();
    }
  }

  private log(message: string) {
    (this.device ?? console).log(message);
  }

  private error(message: unknown) {
    (this.device ?? console).error(message);
  }

  // Unimplemented for now (we only use accelerator notifications)

  getAccelerometerData(): Promise<AccelerometerData | undefined> {
    throw new Error("Method not implemented.");
  }
  getAccelerometerPeriod(): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }
  setAccelerometerPeriod(_value: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setLedText(_text: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getLedScrollingDelay(): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }
  setLedScrollingDelay(_delayInMillis: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getLedMatrix(): Promise<LedMatrix | undefined> {
    throw new Error("Method not implemented.");
  }
  setLedMatrix(_matrix: LedMatrix): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getMagnetometerData(): Promise<MagnetometerData | undefined> {
    throw new Error("Method not implemented.");
  }
  getMagnetometerBearing(): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }
  getMagnetometerPeriod(): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }
  setMagnetometerPeriod(_value: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  triggerMagnetometerCalibration(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  uartWrite(_data: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }

  serialWrite(_data: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

const convertDataToMemoryMap = (
  data: string | Uint8Array | MemoryMap
): MemoryMap => {
  if (data instanceof MemoryMap) {
    return data;
  }
  if (data instanceof Uint8Array) {
    return MemoryMap.fromPaddedUint8Array(data);
  }
  return MemoryMap.fromHex(data);
};

import {
  BleClient,
  BleDevice,
  TimeoutOptions,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import {
  MicroBitMode,
  PartialFlashingService,
} from "./partial-flashing-service";

export enum BluetoothInitializationResult {
  MissingPermissions = "MissingPermissions",
  BluetoothDisabled = "BluetoothDisabled",
  Success = "Success",
}

export const bondingTimeoutInMs = 40_000;
export const connectTimeoutInMs = 10_000;
const scanningTimeoutInMs = 10_000;
const disconnectSymbol: unique symbol = Symbol("disconnected");
const timeoutSymbol: unique symbol = Symbol("timeout");

export class BluetoothError extends Error {}

export class TimeoutError extends BluetoothError {
  constructor() {
    super("Timeout");
  }
}

export class DisconnectError extends BluetoothError {
  constructor() {
    super("Disconnect");
  }
}

const isAndroid = () => Capacitor.getPlatform() === "android";
type BleClientError = { message: string; errorMessage: string };

/**
 * Initializes BLE.
 */
export async function initializeBluetooth(): Promise<BluetoothInitializationResult> {
  try {
    // Check if location is enabled.
    if (isAndroid()) {
      const isLocationEnabled = await BleClient.isLocationEnabled();
      if (!isLocationEnabled) {
        return BluetoothInitializationResult.MissingPermissions;
      }
    }
    await BleClient.initialize({ androidNeverForLocation: true });
    // Check if Bluetooth is enabled.
    const isBluetoothEnabled = await BleClient.isEnabled();
    if (!isBluetoothEnabled) {
      return BluetoothInitializationResult.BluetoothDisabled;
    }
    return BluetoothInitializationResult.Success;
  } catch (e: unknown) {
    const error = e as BleClientError;
    if (error.message === "BLE permission denied") {
      // Error thrown for iOS platform.
      return BluetoothInitializationResult.BluetoothDisabled;
    }
    console.log("Error initializing Bluetooth", error);
    return BluetoothInitializationResult.MissingPermissions;
  }
}

async function checkBondedDevices(predicate: (device: BleDevice) => boolean) {
  if (!isAndroid()) {
    // Not supported.
    return undefined;
  }
  const bondedDevices = await BleClient.getBondedDevices();
  const result = bondedDevices.find(predicate);
  console.log(
    result === undefined
      ? "No matching bonded device"
      : "Found matching bonded device"
  );
  return result;
}

/**
 * Finds device with specified name prefix.
 *
 * @returns device or undefined if none can be found.
 */
export async function findMatchingDevice(
  namePrefix: string
): Promise<BleDevice | undefined> {
  // Check for existing bonded devices.
  const bonded = await checkBondedDevices((device: BleDevice) => {
    const name = device.name;
    return !!name && name.startsWith(namePrefix);
  });
  if (bonded) {
    return bonded;
  }

  console.log(`Scanning for device - ${namePrefix}`);
  let found = false;
  const scanPromise: Promise<BleDevice> = new Promise(
    (resolve) =>
      // This only resolves when we stop the scan.
      void BleClient.requestLEScan({}, async (result) => {
        // For a V1 in the Nordic bootloader, we see a name of "DfuTarg" that
        // isn't matched by the name filter but the advertising name is in the
        // localName on the device. So we filter here instead.  This happens on
        // iOS DFU fails / is interrupted.
        if (
          result.device.name?.startsWith(namePrefix) ||
          result.localName?.startsWith(namePrefix)
        ) {
          found = true;
          await BleClient.stopLEScan();
          console.log("Found device", JSON.stringify(result));
          resolve(result.device);
        }
      })
  );
  const scanTimeoutPromise: Promise<undefined> = new Promise((resolve) =>
    setTimeout(async () => {
      if (!found) {
        await BleClient.stopLEScan();
        console.log("Timeout scanning for device");
      }
      resolve(undefined);
    }, scanningTimeoutInMs)
  );
  return await Promise.race([scanPromise, scanTimeoutPromise]);
}

export class Device {
  private tag: string | undefined;
  disconnectTracker:
    | { promise: Promise<typeof disconnectSymbol>; onDisconnect: () => void }
    | undefined;
  private notificationListeners = new Map<
    string,
    Set<(data: Uint8Array) => void>
  >();

  constructor(public deviceId: string, public name: string | undefined) {}

  async connect(tag: string) {
    this.tag = tag;
    let onDisconnect: (() => void) | undefined;
    const promise = new Promise<typeof disconnectSymbol>((resolve) => {
      onDisconnect = () => {
        this.log("Disconnected");
        this.notificationListeners = new Map();
        resolve(disconnectSymbol);
      };
    });
    this.disconnectTracker = { promise, onDisconnect: onDisconnect! };
    this.log("Connecting");
    await BleClient.connect(this.deviceId, onDisconnect, {
      timeout: connectTimeoutInMs,
    });
    this.log("Connected");
  }

  async startNotifications(
    serviceId: string,
    characteristicId: string,
    options?: TimeoutOptions
  ): Promise<void> {
    const key = this.getNotificationKey(serviceId, characteristicId);
    await this.raceDisconnectAndTimeout(
      BleClient.startNotifications(
        this.deviceId,
        serviceId,
        characteristicId,
        (value: DataView) => {
          const bytes = new Uint8Array(value.buffer);
          // Notify all registered callbacks.
          this.notificationListeners.get(key)?.forEach((cb) => cb(bytes));
        },
        options
      ),
      { actionName: "start notifications" }
    );
  }

  private subscribe(
    serviceId: string,
    characteristicId: string,
    callback: (data: Uint8Array) => void
  ): void {
    const key = this.getNotificationKey(serviceId, characteristicId);
    if (!this.notificationListeners.has(key)) {
      this.notificationListeners.set(key, new Set());
    }
    this.notificationListeners.get(key)!.add(callback);
  }

  private unsubscribe(
    serviceId: string,
    characteristicId: string,
    callback: (data: Uint8Array) => void
  ): void {
    const key = this.getNotificationKey(serviceId, characteristicId);
    this.notificationListeners.get(key)?.delete(callback);
  }

  async stopNotifications(
    serviceId: string,
    characteristicId: string
  ): Promise<void> {
    await BleClient.stopNotifications(
      this.deviceId,
      serviceId,
      characteristicId
    );
    const key = this.getNotificationKey(serviceId, characteristicId);
    this.notificationListeners.delete(key);
  }

  /**
   * Write to characteristic and wait for a notification response.
   *
   * It is the responsibility of the caller to have started notifications
   * for the characteristic.
   */
  async writeForNotification(
    serviceId: string,
    characteristicId: string,
    value: DataView,
    notificationId: number,
    isFinalNotification: (p: Uint8Array) => boolean = () => true
  ): Promise<Uint8Array> {
    let notificationListener: ((bytes: Uint8Array) => void) | undefined;
    const notificationPromise = new Promise<Uint8Array>((resolve) => {
      notificationListener = (bytes: Uint8Array) => {
        if (bytes[0] === notificationId && isFinalNotification(bytes)) {
          resolve(bytes);
        }
      };
      this.subscribe(serviceId, characteristicId, notificationListener);
    });

    try {
      await BleClient.writeWithoutResponse(
        this.deviceId,
        serviceId,
        characteristicId,
        value
      );
      return await this.raceDisconnectAndTimeout(notificationPromise, {
        timeout: 3_000,
        actionName: "flash notification wait",
      });
    } finally {
      if (notificationListener) {
        this.unsubscribe(serviceId, characteristicId, notificationListener);
      }
    }
  }

  async waitForDisconnect(timeout: number): Promise<void> {
    if (!this.disconnectTracker) {
      this.log("Waiting for disconnect but not connected");
      return;
    }
    this.log(`Waiting for disconnect (timeout ${timeout})`);
    const result = await Promise.race([
      this.disconnectTracker.promise,
      this.timeoutPromise(timeout),
    ]);
    if (result === timeoutSymbol) {
      this.log("Timeout waiting for disconnect");
      throw new TimeoutError();
    }
  }

  /**
   * Suitable for running a series of BLE interactions with an overall timeout
   * and general disconnection
   */
  async raceDisconnectAndTimeout<T>(
    promise: Promise<T>,
    options: {
      actionName?: string;
      timeout?: number;
    } = {}
  ): Promise<T> {
    if (!this.disconnectTracker) {
      throw new DisconnectError();
    }
    const actionName = options.actionName ?? "action";
    const result = await Promise.race([
      promise,
      this.disconnectTracker.promise,
      ...(options.timeout ? [this.timeoutPromise(options.timeout)] : []),
    ]);
    if (result === timeoutSymbol) {
      this.log(`Timeout during ${actionName}`);
      throw new TimeoutError();
    }
    if (result === disconnectSymbol) {
      this.log(`Disconnected during ${actionName}`);
      throw new DisconnectError();
    }
    return result;
  }

  async disconnect() {
    await BleClient.disconnect(this.deviceId);
  }

  private timeoutPromise(timeout: number): Promise<typeof timeoutSymbol> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(timeoutSymbol), timeout)
    );
  }

  log(message: string) {
    console.log(`[${this.tag}] ${message}`);
  }

  error(e: unknown) {
    console.error(e);
  }

  private getNotificationKey(
    serviceId: string,
    characteristicId: string
  ): string {
    return `${serviceId}:${characteristicId}`;
  }
}

/**
 * Bonds with device and handles the post-bond device state only returning
 * when we can reattempt a connection with the device.
 *
 * @returns true if successful or false if unsuccessful.
 */
export async function connectHandlingBond(device: Device): Promise<boolean> {
  const startTime = Date.now();
  try {
    const maybeJustBonded = await bondConnectDeviceInternal(device);
    if (maybeJustBonded) {
      // If we did just bond then the device disconnects after 2_000 and then
      // resets after a further 13_000 In future we'd like a firmware change
      // that means it doesn't reset when partial flashing is in progress.
      device.log(isAndroid() ? "New bond" : "Potential new bond");

      // On Android with micro:bit V1 we don't see this disconnect (just the 15s
      // reboot) so we hit the timeout and then continue to reset into pairing
      // mode.
      // TODO: document what happens with iOS micro:bit V1 in the new bond case.
      try {
        await device.waitForDisconnect(3000);
      } catch (e) {
        if (e instanceof TimeoutError) {
          device.log("No disconnect after bond, assuming connection is stable");
          if (!isAndroid()) {
            // We never knew for sure whether this was a new bond. Assume we
            // were already bonded on the basis we didn't get disconnected.
            return true;
          }
        } else {
          throw e;
        }
      }

      await device.connect("post-bond pre-reset");
      // TODO: check this is needed, potentially inline into connect if always needed
      await delay(500);
      device.log("Resetting to pairing mode");
      const pf = new PartialFlashingService(device);
      await pf.resetToMode(MicroBitMode.Pairing);
      await device.waitForDisconnect(10_000);
      await device.connect("post-bond-dance");
      device.log(`Connection ready; took ${Date.now() - startTime}`);
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function bondConnectDeviceInternal(device: Device): Promise<boolean> {
  const { deviceId } = device;
  if (isAndroid()) {
    let justBonded = false;
    // This gets us a nicer pairing dialog than just going straight for the characteristic.
    if (!(await BleClient.isBonded(deviceId))) {
      await BleClient.createBond(deviceId, { timeout: bondingTimeoutInMs });
      justBonded = true;
    }
    await device.connect("initial");

    return justBonded;
  } else {
    // Long timeout as this is the point that the pairing dialog will show.
    // If this responds very quickly maybe we could assume there was a bond?
    // At the moment we always do the disconnect dance so subsequent code will
    // need to call startNotifications again. We need to be connected to
    // startNotifications.
    await device.connect("initial");
    const pf = new PartialFlashingService(device);
    await pf.startNotifications({ timeout: bondingTimeoutInMs });
    return true;
  }
}

/**
 * Check bond state with device.
 *
 * @returns true if bonded or false if not bonded.
 */
export async function checkBondState(device: BleDevice): Promise<boolean> {
  if (!isAndroid()) {
    // Handled by the OS.
    return true;
  }
  return BleClient.isBonded(device.deviceId);
}

export const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { isNativePlatform } from "../platform";

/**
 * DeviceConnection is a messy generic type.
 * This is more practical.
 */
export type MicrobitConnection =
  | MicrobitWebBluetoothConnection
  | MicrobitWebUSBConnection;

export const isBluetoothConnection = (
  connection: MicrobitConnection
): connection is MicrobitWebBluetoothConnection =>
  "setNameFilter" in connection;

export const isWebUSBConnection = (connection: MicrobitConnection) =>
  "setRequestDeviceExclusionFilters" in connection;

export const isNativeBluetoothConnection = (
  connection: MicrobitConnection
): connection is MicrobitWebBluetoothConnection =>
  isBluetoothConnection(connection) && isNativePlatform();

/**
 * Check if Web Bluetooth is supported.
 * On native platforms, we use native Bluetooth, not Web Bluetooth.
 */
export const isWebBluetoothSupported = async (
  bluetooth: MicrobitWebBluetoothConnection
): Promise<boolean> => {
  if (isNativePlatform()) {
    return false;
  }
  // Only check for "unsupported" - the browser's device picker handles the
  // disabled case with its own UI ("Turn on Bluetooth to allow pairing").
  const status = await bluetooth.checkAvailability();
  return status !== "unsupported";
};

/**
 * Check if Web USB is supported.
 */
export const isWebUsbSupported = async (
  usb: MicrobitWebUSBConnection
): Promise<boolean> => {
  const status = await usb.checkAvailability();
  return status !== "unsupported";
};

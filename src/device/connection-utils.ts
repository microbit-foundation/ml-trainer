import { MicrobitBluetoothConnection } from "@microbit/microbit-connection/bluetooth";
import { MicrobitUSBConnection } from "@microbit/microbit-connection/usb";
import { isNativePlatform } from "../platform";

/**
 * DeviceConnection is a messy generic type.
 * This is more practical.
 */
export type MicrobitConnection =
  | MicrobitBluetoothConnection
  | MicrobitUSBConnection;

export const isBluetoothConnection = (
  connection: MicrobitConnection
): connection is MicrobitBluetoothConnection => "setNameFilter" in connection;

export const isWebUSBConnection = (connection: MicrobitConnection) =>
  "setRequestDeviceExclusionFilters" in connection;

export const isNativeBluetoothConnection = (
  connection: MicrobitConnection
): connection is MicrobitBluetoothConnection =>
  isBluetoothConnection(connection) && isNativePlatform();

/**
 * Check if Web Bluetooth is supported.
 * On native platforms, we use native Bluetooth, not Web Bluetooth.
 */
export const isWebBluetoothSupported = async (
  bluetooth: MicrobitBluetoothConnection
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
  usb: MicrobitUSBConnection
): Promise<boolean> => {
  const status = await usb.checkAvailability();
  return status !== "unsupported";
};

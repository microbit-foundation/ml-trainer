import { Capacitor } from "@capacitor/core";
import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";

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
  isBluetoothConnection(connection) && Capacitor.isNativePlatform();

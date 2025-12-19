import {
  MicrobitWebBluetoothConnection,
  MicrobitWebUSBConnection,
} from "@microbit/microbit-connection";
import { MicrobitCapacitorBluetoothConnection } from "./capacitor-ble";

/**
 * DeviceConnection is a messy generic type.
 * This is more practical.
 */
export type MicrobitConnection =
  | MicrobitWebBluetoothConnection
  | MicrobitCapacitorBluetoothConnection
  | MicrobitWebUSBConnection;

/**
 * The connections we can flash.
 */
export type MicrobitFlashConnection =
  | MicrobitCapacitorBluetoothConnection
  | MicrobitWebUSBConnection;

export const isBluetoothConnection = (
  connection: MicrobitConnection
): connection is
  | MicrobitWebBluetoothConnection
  | MicrobitCapacitorBluetoothConnection => "setNameFilter" in connection;

export const isWebUSBConnection = (connection: MicrobitConnection) =>
  "setRequestDeviceExclusionFilters" in connection;

export const isNativeBluetoothConnection = (connection: MicrobitConnection) =>
  connection instanceof MicrobitCapacitorBluetoothConnection;

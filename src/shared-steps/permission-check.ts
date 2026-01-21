/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ConnectionAvailabilityStatus } from "@microbit/microbit-connection";
import { PermissionEvent } from "./permission-events";

/**
 * Interface for a connection that can check Bluetooth availability.
 */
interface BluetoothAvailabilityChecker {
  checkAvailability(): Promise<ConnectionAvailabilityStatus>;
}

/**
 * Check Bluetooth permissions and return the appropriate event.
 * Used by native Bluetooth flows to provide better error feedback.
 *
 * @param bluetooth - Connection with checkAvailability method
 * @returns The permission event to dispatch
 */
export const checkPermissions = async (
  bluetooth: BluetoothAvailabilityChecker
): Promise<PermissionEvent> => {
  let status: ConnectionAvailabilityStatus;
  try {
    status = await bluetooth.checkAvailability();
  } catch {
    // Treat unexpected errors as permission denied
    return { type: "permissionDenied" };
  }
  switch (status) {
    case "available":
      return { type: "permissionsOk" };
    case "disabled":
    case "unsupported":
      // Treat unsupported the same as disabled - no meaningful devices lack BLE
      return { type: "bluetoothDisabled" };
    case "permission-denied":
      return { type: "permissionDenied" };
    case "location-disabled":
      return { type: "locationDisabled" };
  }
};

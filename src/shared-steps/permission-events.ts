/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Permission check result events shared by both data connection and download flows.
 * These events are sent after checking Bluetooth permissions on native platforms.
 */
export type PermissionEvent =
  | { type: "permissionsOk" }
  | { type: "bluetoothDisabled" }
  | { type: "permissionDenied" }
  | { type: "locationDisabled" };

/**
 * Events for permission error dialogs.
 */
export type PermissionDialogEvent = { type: "tryAgain" };

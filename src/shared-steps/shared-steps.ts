/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Permission error steps shared between data connection and download flows.
 * These have common handler logic via createPermissionErrorStateHandlers.
 */
export const PermissionStep = {
  BluetoothDisabled: "BluetoothDisabled",
  BluetoothPermissionDenied: "BluetoothPermissionDenied",
  LocationDisabled: "LocationDisabled",
} as const;

export type PermissionStep =
  (typeof PermissionStep)[keyof typeof PermissionStep];

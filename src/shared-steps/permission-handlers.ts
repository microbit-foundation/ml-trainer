/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { PermissionStep } from "./shared-steps";

/**
 * Action to check Bluetooth permissions.
 */
type CheckPermissionsAction = { type: "checkPermissions" };

/**
 * Action to set the checking permissions flag.
 */
type SetCheckingPermissionsAction = {
  type: "setCheckingPermissions";
  value: boolean;
};

/**
 * Actions used by permission handlers.
 */
export type PermissionAction =
  | CheckPermissionsAction
  | SetCheckingPermissionsAction;

/**
 * Permission error transitions from checkPermissions action.
 * Use these in the starting step where permissions are first checked.
 */
export const permissionErrorTransitions = {
  bluetoothDisabled: {
    target: PermissionStep.BluetoothDisabled,
  },
  permissionDenied: {
    target: PermissionStep.BluetoothPermissionDenied,
  },
  locationDisabled: {
    target: PermissionStep.LocationDisabled,
  },
} as const;

/**
 * Create handlers for permission error states (BluetoothDisabled, BluetoothPermissionDenied, LocationDisabled).
 *
 * @param successTarget - The step to go to after permissions are OK
 * @returns Event handlers for permission error states
 */
export const createPermissionErrorStateHandlers = <TTarget extends string>(
  successTarget: TTarget
) => ({
  tryAgain: {
    actions: [
      { type: "setCheckingPermissions", value: true },
      { type: "checkPermissions" },
    ] satisfies PermissionAction[],
  },
  permissionsOk: {
    target: successTarget,
    actions: [
      { type: "setCheckingPermissions", value: false },
    ] satisfies PermissionAction[],
  },
  bluetoothDisabled: {
    target: PermissionStep.BluetoothDisabled,
    actions: [
      { type: "setCheckingPermissions", value: false },
    ] satisfies PermissionAction[],
  },
  permissionDenied: {
    target: PermissionStep.BluetoothPermissionDenied,
    actions: [
      { type: "setCheckingPermissions", value: false },
    ] satisfies PermissionAction[],
  },
  locationDisabled: {
    target: PermissionStep.LocationDisabled,
    actions: [
      { type: "setCheckingPermissions", value: false },
    ] satisfies PermissionAction[],
  },
});

/**
 * Create handlers for a step that needs to check permissions before proceeding.
 *
 * @param successTarget - The step to go to after permissions are OK
 * @returns Event handlers that include permission checking on "next"
 */
export const createStartStepWithPermissionHandlers = <TTarget extends string>(
  successTarget: TTarget
) => ({
  next: {
    actions: [{ type: "checkPermissions" }] satisfies PermissionAction[],
  },
  permissionsOk: {
    target: successTarget,
  },
  ...permissionErrorTransitions,
});

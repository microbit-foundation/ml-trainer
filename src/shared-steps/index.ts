/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export { PermissionStep } from "./shared-steps";

export type {
  PermissionEvent,
  PermissionDialogEvent,
} from "./permission-events";

export {
  permissionErrorTransitions,
  createPermissionErrorStateHandlers,
  createStartStepWithPermissionHandlers,
  type PermissionAction,
} from "./permission-handlers";

export { checkPermissions } from "./permission-check";

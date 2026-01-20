/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  backToStartTransition,
  bluetoothRecoveryStates,
  connectedState,
  connectFlashSuccessHandler,
  createInitialConnectHandlers,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBluetoothReconnect,
  idleFreshStart,
  setMicrobitNameHandler,
} from "./data-connection-machine-common";
import { DataConnectionStep } from "./data-connection-types";
import { always } from "../state-machine";

// Permission error transitions from checkPermissions
const permissionErrorTransitions = {
  bluetoothDisabled: {
    target: DataConnectionStep.BluetoothDisabled,
  },
  permissionDenied: {
    target: DataConnectionStep.BluetoothPermissionDenied,
  },
  locationDisabled: {
    target: DataConnectionStep.LocationDisabled,
  },
};

// Shared handlers for Start and StartOver - check permissions before tutorial
const startStepHandlers = {
  next: {
    actions: [{ type: "checkPermissions" as const }],
  },
  permissionsOk: {
    target: DataConnectionStep.NativeBluetoothPreConnectTutorial,
  },
  ...permissionErrorTransitions,
};

// Connect failure handlers that route permission errors to appropriate states
const connectFailureWithPermissionHandling = [
  {
    guard: guards.isBluetoothDisabledError,
    target: DataConnectionStep.BluetoothDisabled,
  },
  {
    guard: guards.isPermissionDeniedError,
    target: DataConnectionStep.BluetoothPermissionDenied,
  },
  {
    guard: guards.isLocationDisabledError,
    target: DataConnectionStep.LocationDisabled,
  },
  {
    guard: always,
    target: DataConnectionStep.ConnectFailed,
  },
];

// Permission error state handlers - tryAgain re-runs permission check.
// After successful permission check, always go to the tutorial step.
// The stored micro:bit name (if any) will be pre-filled, so users can
// just click Next to continue without re-entering the pattern.
const createPermissionErrorStateHandlers = () => ({
  // Re-check permissions when user tries again
  tryAgain: {
    actions: [
      { type: "setCheckingPermissions" as const, value: true },
      { type: "checkPermissions" as const },
    ],
  },
  // Permission check passed - go to tutorial (name will be pre-filled if stored)
  permissionsOk: {
    target: DataConnectionStep.NativeBluetoothPreConnectTutorial,
    actions: [{ type: "setCheckingPermissions" as const, value: false }],
  },
  // Permission check failed - stay in error state or switch to appropriate one
  bluetoothDisabled: {
    target: DataConnectionStep.BluetoothDisabled,
    actions: [{ type: "setCheckingPermissions" as const, value: false }],
  },
  permissionDenied: {
    target: DataConnectionStep.BluetoothPermissionDenied,
    actions: [{ type: "setCheckingPermissions" as const, value: false }],
  },
  locationDisabled: {
    target: DataConnectionStep.LocationDisabled,
    actions: [{ type: "setCheckingPermissions" as const, value: false }],
  },
});

export const nativeBluetoothFlow: DataConnectionFlowDef = {
  ...globalHandlers,

  // Entry point
  [DataConnectionStep.Idle]: {
    on: {
      connect: [idleBluetoothReconnect, idleFreshStart],
    },
  },

  // Happy path: Start → NativeBluetoothPreConnectTutorial → BluetoothPattern
  //           → FlashingInProgress → BluetoothConnect → Connected
  // Permission check at Start/StartOver, then connect handles any further checks.
  [DataConnectionStep.Start]: {
    on: startStepHandlers,
  },

  // Permission error states with retry option.
  // tryAgain re-attempts connect (which will re-check permissions internally).
  [DataConnectionStep.BluetoothDisabled]: {
    on: createPermissionErrorStateHandlers(),
  },
  [DataConnectionStep.BluetoothPermissionDenied]: {
    on: createPermissionErrorStateHandlers(),
  },
  [DataConnectionStep.LocationDisabled]: {
    on: createPermissionErrorStateHandlers(),
  },

  [DataConnectionStep.NativeBluetoothPreConnectTutorial]: {
    on: {
      next: { target: DataConnectionStep.BluetoothPattern },
      back: backToStartTransition,
      // Internal transition to toggle between pairing method variants
      switchPairingMethod: {
        actions: [{ type: "togglePairingMethod" }],
      },
    },
  },

  [DataConnectionStep.BluetoothPattern]: {
    on: {
      // Go directly to flashing - connectFlash() handles permission checks internally
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "connectFlash" }],
      },
      back: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
      ...setMicrobitNameHandler,
    },
  },

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      ...connectFlashSuccessHandler,
      connectFailure: connectFailureWithPermissionHandling,
      flashSuccess: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [{ type: "connectData" }],
      },
      flashFailure: {
        target: DataConnectionStep.ConnectFailed,
      },
    },
  },

  [DataConnectionStep.BluetoothConnect]: {
    on: {
      ...createInitialConnectHandlers(),
    },
  },

  // Success state
  ...connectedState,

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    entry: [{ type: "setIsStartingOver", value: true }],
    on: startStepHandlers,
  },

  ...bluetoothRecoveryStates,
};

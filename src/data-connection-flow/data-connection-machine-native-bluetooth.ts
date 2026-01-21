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
import {
  createPermissionErrorStateHandlers,
  createStartStepWithPermissionHandlers,
} from "../shared-steps";

// Shared handlers for Start and StartOver - check permissions before tutorial
const startStepHandlers = createStartStepWithPermissionHandlers(
  DataConnectionStep.NativeBluetoothPreConnectTutorial
);

// Connect failure handlers that route permission errors to appropriate states
const connectFlashFailureWithPermissionHandling = [
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

// Permission error state handlers using shared factory
const permissionErrorStateHandlers = createPermissionErrorStateHandlers(
  DataConnectionStep.NativeBluetoothPreConnectTutorial
);

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
    on: permissionErrorStateHandlers,
  },
  [DataConnectionStep.BluetoothPermissionDenied]: {
    on: permissionErrorStateHandlers,
  },
  [DataConnectionStep.LocationDisabled]: {
    on: permissionErrorStateHandlers,
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
      connectFlashFailure: connectFlashFailureWithPermissionHandling,
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

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  backToStartTransition,
  connectedState,
  connectFlashSuccessHandler,
  createInitialConnectHandlers,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBluetoothReconnect,
  idleFreshStart,
  nativeBluetoothRecoveryStates,
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

// Error guards for native Bluetooth - route known errors to specific dialogs
const nativeBluetoothErrorGuards = [
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
];

// Connect failure handlers that route known errors to specific states
const connectFlashFailureWithErrorHandling = [
  ...nativeBluetoothErrorGuards,
  {
    guard: guards.isPairingInformationLostError,
    target: DataConnectionStep.PairingLost,
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
      next: [
        {
          guard: guards.hasMicrobitName,
          target: DataConnectionStep.NativeCompareBluetoothPattern,
        },
        {
          guard: always,
          target: DataConnectionStep.EnterBluetoothPattern,
        },
      ],
      back: backToStartTransition,
      troubleshootPairingMethod: {
        target: DataConnectionStep.NativeBluetoothPreConnectTroubleshooting,
      },
    },
  },

  [DataConnectionStep.NativeBluetoothPreConnectTroubleshooting]: {
    on: {
      tryAgain: {
        target: DataConnectionStep.NativeBluetoothPreConnectTutorial,
      },
    },
  },

  [DataConnectionStep.EnterBluetoothPattern]: {
    on: {
      // Go directly to flashing - connectFlash() handles permission checks internally
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [
          { type: "setIsDeviceBonded", value: false },
          { type: "connectFlash", clearDevice: true },
        ],
      },
      back: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
      ...setMicrobitNameHandler,
    },
  },

  [DataConnectionStep.NativeCompareBluetoothPattern]: {
    on: {
      // Go directly to flashing - connectFlash() handles permission checks internally
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "connectFlash" }],
      },
      back: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
      changeBluetoothPattern: {
        target: DataConnectionStep.EnterBluetoothPattern,
        actions: [{ type: "clearMicrobitName" }],
      },
    },
  },

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      ...connectFlashSuccessHandler,
      connectFlashFailure: connectFlashFailureWithErrorHandling,
      flashSuccess: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [
          { type: "setIsDeviceBonded", value: true },
          { type: "connectData" },
        ],
      },
      flashFailure: {
        target: DataConnectionStep.ConnectFailed,
      },
      tryAgain: {
        target: DataConnectionStep.EnterBluetoothPattern,
        actions: [
          { type: "clearMicrobitName" },
          { type: "abortFindingDevice" },
        ],
      },
    },
  },

  [DataConnectionStep.BluetoothConnect]: {
    on: {
      ...createInitialConnectHandlers({
        // Handle permission errors that can occur during connectData
        // (e.g., Bluetooth disabled while connecting to data services)
        connectFlashFailureGuards: nativeBluetoothErrorGuards,
      }),
    },
  },

  // Success state
  ...connectedState,

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    entry: [{ type: "setIsStartingOver", value: true }],
    on: startStepHandlers,
  },

  ...nativeBluetoothRecoveryStates,
};

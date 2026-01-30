/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DownloadStep } from "./download-types";
import { always } from "../state-machine";
import {
  DownloadFlowDefinition,
  globalHandlers,
  guards,
} from "./download-machine-common";
import {
  createPermissionErrorStateHandlers,
  permissionErrorTransitions,
} from "../shared-steps";

// Permission error state handlers using shared factory
const permissionErrorStateHandlers = createPermissionErrorStateHandlers(
  DownloadStep.NativeBluetoothPreConnectTutorial
);

// Connect failure handlers that route permission errors to appropriate states
const connectFlashFailureWithPermissionHandling = [
  {
    guard: guards.isBluetoothDisabledError,
    target: DownloadStep.BluetoothDisabled,
  },
  {
    guard: guards.isPermissionDeniedError,
    target: DownloadStep.BluetoothPermissionDenied,
  },
  {
    guard: guards.isLocationDisabledError,
    target: DownloadStep.LocationDisabled,
  },
  {
    guard: guards.isPairingInformationLostError,
    target: DownloadStep.PairingLost,
  },
  {
    guard: always,
    target: DownloadStep.ConnectFailed,
  },
];

// FlashingInProgress state with V1 board version check and permission error handling.
const flashingInProgressWithPermissionHandling: DownloadFlowDefinition = {
  [DownloadStep.FlashingInProgress]: {
    entry: [{ type: "initializeFlashingProgress" }],
    on: {
      connectFlashSuccess: [
        {
          guard: guards.isV1BoardVersion,
          target: DownloadStep.IncompatibleDevice,
        },
        {
          guard: always,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "flash" }],
        },
      ],
      tryAgain: {
        target: DownloadStep.EnterBluetoothPattern,
        actions: [
          { type: "clearMicrobitName" },
          { type: "abortFindingDevice" },
        ],
      },
      connectFlashFailure: connectFlashFailureWithPermissionHandling,
      flashSuccess: { target: DownloadStep.None },
      flashFailure: {
        target: DownloadStep.ConnectFailed,
      },
    },
  },
};

export const nativeBluetoothFlow: DownloadFlowDefinition = {
  ...globalHandlers,

  [DownloadStep.None]: {
    exit: [{ type: "initializeDownload" }],
    on: {
      start: [
        // Skip help if we've downloaded before this session
        {
          guard: guards.hasDownloadedBefore,
          target: DownloadStep.NativeBluetoothPreConnectTutorial,
          actions: [{ type: "checkPermissions" }],
        },
        // Show help on first download (if setting enabled)
        {
          guard: guards.shouldShowHelp,
          target: DownloadStep.Help,
          actions: [{ type: "checkPermissions" }],
        },
        {
          guard: always,
          target: DownloadStep.NativeBluetoothPreConnectTutorial,
          actions: [{ type: "checkPermissions" }],
        },
      ],
      // Permission check results (from checkPermissions action)
      permissionsOk: {
        // Stay in current target - permission check is non-blocking for start
      },
      ...permissionErrorTransitions,
    },
  },

  [DownloadStep.Help]: {
    on: {
      next: {
        target: DownloadStep.NativeBluetoothPreConnectTutorial,
        actions: [{ type: "saveHelpPreference" }],
      },
      // Handle permission errors that arrive while on help screen
      ...permissionErrorTransitions,
    },
  },

  // Permission error states with retry option.
  [DownloadStep.BluetoothDisabled]: {
    on: permissionErrorStateHandlers,
  },
  [DownloadStep.BluetoothPermissionDenied]: {
    on: permissionErrorStateHandlers,
  },
  [DownloadStep.LocationDisabled]: {
    on: permissionErrorStateHandlers,
  },

  [DownloadStep.NativeBluetoothPreConnectTutorial]: {
    entry: [{ type: "disconnectDataConnection" }],
    on: {
      next: [
        {
          guard: guards.hasMicrobitName,
          target: DownloadStep.NativeCompareBluetoothPattern,
        },
        {
          guard: always,
          target: DownloadStep.EnterBluetoothPattern,
        },
      ],
      back: [{ guard: guards.shouldShowHelp, target: DownloadStep.Help }],
      troubleshootPairingMethod: {
        target: DownloadStep.NativeBluetoothPreConnectTroubleshooting,
      },
    },
  },

  [DownloadStep.NativeBluetoothPreConnectTroubleshooting]: {
    on: {
      tryAgain: {
        target: DownloadStep.NativeBluetoothPreConnectTutorial,
      },
    },
  },

  [DownloadStep.EnterBluetoothPattern]: {
    on: {
      next: {
        target: DownloadStep.FlashingInProgress,
        actions: [{ type: "connectFlash" }],
      },
      back: { target: DownloadStep.NativeBluetoothPreConnectTutorial },
      setMicrobitName: {
        actions: [{ type: "setMicrobitName" }],
      },
    },
  },

  [DownloadStep.NativeCompareBluetoothPattern]: {
    on: {
      next: {
        target: DownloadStep.FlashingInProgress,
        actions: [{ type: "connectFlash" }],
      },
      back: { target: DownloadStep.NativeBluetoothPreConnectTutorial },
      changeBluetoothPattern: {
        target: DownloadStep.EnterBluetoothPattern,
        actions: [{ type: "clearMicrobitName" }],
      },
    },
  },

  ...flashingInProgressWithPermissionHandling,

  [DownloadStep.PairingLost]: {
    on: {
      tryAgain: { target: DownloadStep.NativeBluetoothPreConnectTutorial },
    },
  },

  [DownloadStep.ConnectFailed]: {
    on: {
      tryAgain: { target: DownloadStep.NativeBluetoothPreConnectTutorial },
    },
  },

  [DownloadStep.IncompatibleDevice]: {
    on: {
      back: { target: DownloadStep.EnterBluetoothPattern },
    },
  },
};

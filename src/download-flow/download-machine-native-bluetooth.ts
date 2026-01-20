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
  manualFlashingTutorialState,
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
    guard: always,
    target: DownloadStep.ManualFlashingTutorial,
    actions: [{ type: "downloadHexFile" as const }],
  },
];

// FlashingInProgress state with V1 board version check and permission error handling.
const flashingInProgressWithPermissionHandling: DownloadFlowDefinition = {
  [DownloadStep.FlashingInProgress]: {
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
      connectFlashFailure: connectFlashFailureWithPermissionHandling,
      flashSuccess: { target: DownloadStep.None },
      flashFailure: {
        target: DownloadStep.ManualFlashingTutorial,
        actions: [{ type: "downloadHexFile" }],
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
        {
          guard: guards.canReuseExistingConnection,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "flash" }],
        },
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
      next: { target: DownloadStep.BluetoothPattern },
      back: [{ guard: guards.shouldShowHelp, target: DownloadStep.Help }],
    },
  },

  [DownloadStep.BluetoothPattern]: {
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

  ...flashingInProgressWithPermissionHandling,

  // TODO: This state and all transitions to it need to be replaced.
  // We need a custom error state (perhaps more than one) for native
  // bluetooth. But for sure not one about drag and drop!
  ...manualFlashingTutorialState,

  [DownloadStep.IncompatibleDevice]: {
    on: {
      back: { target: DownloadStep.BluetoothPattern },
    },
  },
};

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DownloadStep } from "../model";
import { always } from "../state-machine";
import {
  DownloadFlowDefinition,
  flashingInProgressWithV1Check,
  globalHandlers,
  guards,
  manualFlashingTutorialState,
} from "./download-machine-common";

export const nativeBluetoothFlow: DownloadFlowDefinition = {
  ...globalHandlers,

  [DownloadStep.None]: {
    on: {
      start: [
        {
          guard: guards.canReuseExistingConnection,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "initializeDownload" }, { type: "flash" }],
        },
        {
          guard: guards.shouldShowHelp,
          target: DownloadStep.Help,
          actions: [{ type: "initializeDownload" }],
        },
        {
          guard: always,
          target: DownloadStep.NativeBluetoothPreConnectTutorial,
          actions: [
            { type: "initializeDownload" },
            { type: "disconnectDataConnection" },
          ],
        },
      ],
    },
  },

  [DownloadStep.Help]: {
    on: {
      next: {
        target: DownloadStep.NativeBluetoothPreConnectTutorial,
        actions: [
          { type: "saveHelpPreference" },
          { type: "disconnectDataConnection" },
        ],
      },
    },
  },

  [DownloadStep.NativeBluetoothPreConnectTutorial]: {
    on: {
      next: { target: DownloadStep.BluetoothPattern },
      back: [{ guard: guards.shouldShowHelp, target: DownloadStep.Help }],
    },
  },

  [DownloadStep.BluetoothPattern]: {
    on: {
      next: {
        target: DownloadStep.FlashingInProgress,
        actions: [{ type: "connect" }],
      },
      back: { target: DownloadStep.NativeBluetoothPreConnectTutorial },
    },
  },

  ...flashingInProgressWithV1Check,

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

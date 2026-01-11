/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DownloadStep } from "../model";
import { always } from "../state-machine";
import {
  DownloadFlowDefinition,
  flashingInProgressSimple,
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

  ...flashingInProgressSimple,

  ...manualFlashingTutorialState,
};

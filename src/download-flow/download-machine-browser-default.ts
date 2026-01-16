/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DownloadStep, SameOrDifferentChoice } from "./download-types";
import { always } from "../state-machine";
import {
  DownloadFlowDefinition,
  flashingInProgressWithV1Check,
  globalHandlers,
  guards,
  manualFlashingTutorialState,
} from "./download-machine-common";

/**
 * The default download flow for browser platforms.
 *
 * Used when:
 *
 * - The user has a Web Bluetooth data connection and wants to update the hex
 *   (we'll use Web USB with fallback to DnD as we cannot flash over Bluetooth).
 *
 * - The user has no data connection yet (e.g., skipping straight to MakeCode)
 *
 * For radio data connections, see radioFlow.
 * For native app platforms (iOS/Android), see nativeBluetoothFlow.
 */
export const browserDefaultFlow: DownloadFlowDefinition = {
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
        },
        {
          guard: guards.hasActiveDataConnection,
          target: DownloadStep.ChooseSameOrDifferentMicrobit,
        },
        {
          guard: always,
          target: DownloadStep.ConnectCable,
        },
      ],
    },
  },

  [DownloadStep.Help]: {
    on: {
      next: [
        {
          guard: guards.hasActiveDataConnection,
          target: DownloadStep.ChooseSameOrDifferentMicrobit,
          actions: [{ type: "saveHelpPreference" }],
        },
        {
          guard: always,
          target: DownloadStep.ConnectCable,
          actions: [{ type: "saveHelpPreference" }],
        },
      ],
    },
  },

  [DownloadStep.ChooseSameOrDifferentMicrobit]: {
    on: {
      choseSame: [
        {
          guard: guards.isUsbConnectedV1,
          target: DownloadStep.IncompatibleDevice,
        },
        {
          // Fast path: micro:bit already connected via USB (likely never unplugged).
          // Disconnect bluetooth data connection before flashing.
          guard: guards.isUsbConnected,
          target: DownloadStep.FlashingInProgress,
          actions: [
            { type: "setMicrobitChoice", choice: SameOrDifferentChoice.Same },
            { type: "disconnectDataConnection" },
            { type: "connect" },
          ],
        },
        {
          guard: always,
          target: DownloadStep.ConnectCable,
          actions: [
            { type: "setMicrobitChoice", choice: SameOrDifferentChoice.Same },
          ],
        },
      ],
      choseDifferent: {
        target: DownloadStep.ConnectCable,
        actions: [
          {
            type: "setMicrobitChoice",
            choice: SameOrDifferentChoice.Different,
          },
        ],
      },
      back: { target: DownloadStep.Help },
    },
  },

  [DownloadStep.ConnectCable]: {
    on: {
      next: { target: DownloadStep.WebUsbFlashingTutorial },
      back: [
        {
          guard: guards.hasActiveDataConnection,
          target: DownloadStep.ChooseSameOrDifferentMicrobit,
        },
        { guard: guards.shouldShowHelp, target: DownloadStep.Help },
      ],
    },
  },

  [DownloadStep.WebUsbFlashingTutorial]: {
    on: {
      next: [
        {
          // Same micro:bit: disconnect bluetooth data connection before USB connect
          guard: guards.isSameMicrobitChoice,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "disconnectDataConnection" }, { type: "connect" }],
        },
        {
          guard: always,
          target: DownloadStep.FlashingInProgress,
          actions: [{ type: "connect" }],
        },
      ],
      back: { target: DownloadStep.ConnectCable },
    },
  },

  ...flashingInProgressWithV1Check,

  ...manualFlashingTutorialState,

  [DownloadStep.IncompatibleDevice]: {
    on: {
      back: [
        {
          guard: guards.hasActiveDataConnection,
          target: DownloadStep.ChooseSameOrDifferentMicrobit,
        },
        {
          guard: always,
          target: DownloadStep.ConnectCable,
        },
      ],
    },
  },
};

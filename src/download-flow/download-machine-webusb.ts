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

export const webusbFlow: DownloadFlowDefinition = {
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
          guard: guards.hasActiveDataConnection,
          target: DownloadStep.ChooseSameOrDifferentMicrobit,
          actions: [{ type: "initializeDownload" }],
        },
        {
          guard: always,
          target: DownloadStep.ConnectCable,
          actions: [{ type: "initializeDownload" }],
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
          actions: [
            { type: "setMicrobitChoice", choice: SameOrDifferentChoice.Same },
          ],
        },
        {
          // Bluetooth data connection: disconnect input before connecting
          guard: guards.isUsbConnectedWithBluetooth,
          target: DownloadStep.FlashingInProgress,
          actions: [
            { type: "setMicrobitChoice", choice: SameOrDifferentChoice.Same },
            { type: "disconnectDataConnection" },
            { type: "connect" },
          ],
        },
        {
          guard: guards.isUsbConnected,
          target: DownloadStep.FlashingInProgress,
          actions: [
            { type: "setMicrobitChoice", choice: SameOrDifferentChoice.Same },
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
          // Same microbit with bluetooth: disconnect input before connecting
          guard: guards.shouldDisconnectBeforeConnect,
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
      back: { target: DownloadStep.ConnectCable },
    },
  },
};

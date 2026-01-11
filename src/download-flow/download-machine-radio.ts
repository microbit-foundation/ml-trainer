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

export const radioFlow: DownloadFlowDefinition = {
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
          target: DownloadStep.UnplugRadioBridgeMicrobit,
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
        target: DownloadStep.UnplugRadioBridgeMicrobit,
        actions: [
          { type: "saveHelpPreference" },
          { type: "disconnectDataConnection" },
        ],
      },
    },
  },

  [DownloadStep.UnplugRadioBridgeMicrobit]: {
    on: {
      next: { target: DownloadStep.ConnectRadioRemoteMicrobit },
      back: [{ guard: guards.shouldShowHelp, target: DownloadStep.Help }],
    },
  },

  [DownloadStep.ConnectRadioRemoteMicrobit]: {
    on: {
      next: { target: DownloadStep.WebUsbFlashingTutorial },
      back: { target: DownloadStep.UnplugRadioBridgeMicrobit },
    },
  },

  [DownloadStep.WebUsbFlashingTutorial]: {
    on: {
      next: {
        target: DownloadStep.FlashingInProgress,
        actions: [{ type: "connect" }],
      },
      back: { target: DownloadStep.ConnectRadioRemoteMicrobit },
    },
  },

  ...flashingInProgressWithV1Check,

  ...manualFlashingTutorialState,

  [DownloadStep.IncompatibleDevice]: {
    on: {
      back: { target: DownloadStep.ConnectRadioRemoteMicrobit },
    },
  },
};

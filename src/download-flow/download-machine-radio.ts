/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DownloadStep } from "./download-types";
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
          guard: always,
          target: DownloadStep.UnplugRadioBridgeMicrobit,
        },
      ],
    },
  },

  [DownloadStep.Help]: {
    on: {
      next: {
        target: DownloadStep.UnplugRadioBridgeMicrobit,
        actions: [{ type: "saveHelpPreference" }],
      },
    },
  },

  [DownloadStep.UnplugRadioBridgeMicrobit]: {
    entry: [{ type: "disconnectDataConnection" }],
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

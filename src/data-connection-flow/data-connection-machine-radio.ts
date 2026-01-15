/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  actions,
  badFirmwareState,
  createConnectedHandlers,
  createInitialConnectHandlers,
  createRecoveryStates,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBrowserUnsupported,
  switchToWebBluetooth,
  webUsbBluetoothUnsupportedState,
  webUsbFlashingTutorialState,
  webUsbTryAgainStates,
} from "./data-connection-machine-common";
import {
  DataConnectionStep,
  DataConnectionType,
} from "./data-connection-types";
import { always } from "../state-machine";

export const radioFlow: DataConnectionFlowDef = {
  ...globalHandlers,

  // Entry point
  [DataConnectionStep.Idle]: {
    on: {
      connect: [
        idleBrowserUnsupported,
        // If previously connected, attempt direct reconnection
        {
          guard: guards.hadSuccessfulConnection,
          target: DataConnectionStep.ConnectingMicrobits,
          actions: [
            { type: "addStatusListener" },
            { type: "setHasFailedOnce", value: false },
            { type: "setIsStartingOver", value: false },
            { type: "setReconnecting", value: true },
            { type: "connectMicrobits" },
          ],
        },
        // Fresh connection - start from beginning
        {
          guard: always,
          target: DataConnectionStep.Start,
          actions: [
            { type: "addStatusListener" },
            ...actions.reset,
            ...actions.setRemotePhase,
          ],
        },
      ],
    },
  },

  // Happy path: Start → ConnectCable → WebUsbFlashingTutorial → FlashingInProgress
  //           → ConnectBattery → ConnectCable → WebUsbFlashingTutorial → FlashingInProgress
  //           → ConnectingMicrobits → Connected
  [DataConnectionStep.Start]: {
    on: {
      next: { target: DataConnectionStep.ConnectCable },
      ...switchToWebBluetooth,
    },
  },

  [DataConnectionStep.ConnectCable]: {
    on: {
      next: { target: DataConnectionStep.WebUsbFlashingTutorial },
      back: [
        // In bridge phase, go back to ConnectBattery (and switch back to remote phase)
        {
          guard: guards.isInBridgePhase,
          target: DataConnectionStep.ConnectBattery,
          actions: actions.setRemotePhase,
        },
        {
          guard: guards.isStartingOver,
          target: DataConnectionStep.StartOver,
        },
        {
          guard: always,
          target: DataConnectionStep.Start,
        },
      ],
      // Skip is only shown in the UI for dev mode because of the higher chance
      // of users getting confused with two micro:bits.
      skip: { target: DataConnectionStep.ConnectBattery },
      ...switchToWebBluetooth,
    },
  },

  ...webUsbFlashingTutorialState,

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      connectSuccess: [
        // V1 board check only applies in remote phase (first flash)
        {
          guard: (ctx) => guards.isInRemotePhase(ctx) && guards.isV1Board(ctx),
          target: DataConnectionStep.MicrobitUnsupported,
        },
        {
          guard: always,
          target: DataConnectionStep.FlashingInProgress,
          actions: [{ type: "flash" }],
        },
      ],
      connectFailure: [
        {
          guard: guards.isBadFirmwareError,
          target: DataConnectionStep.BadFirmware,
        },
        {
          guard: guards.isNoDeviceSelectedError,
          target: DataConnectionStep.TryAgainWebUsbSelectMicrobit,
        },
        {
          guard: guards.isUnableToClaimError,
          target: DataConnectionStep.TryAgainCloseTabs,
        },
        {
          guard: always,
          target: DataConnectionStep.TryAgainReplugMicrobit,
        },
      ],
      flashSuccess: [
        // Remote phase: go to ConnectBattery
        {
          guard: guards.isInRemotePhase,
          target: DataConnectionStep.ConnectBattery,
          actions: [
            { type: "setRadioRemoteDeviceId" },
            { type: "setBoardVersion" },
          ],
        },
        // Bridge phase: go to ConnectingMicrobits
        {
          guard: always,
          target: DataConnectionStep.ConnectingMicrobits,
          actions: [
            { type: "setRadioBridgeDeviceId" },
            { type: "connectMicrobits" },
          ],
        },
      ],
      flashFailure: [
        {
          guard: guards.isNoDeviceSelectedError,
          target: DataConnectionStep.TryAgainWebUsbSelectMicrobit,
        },
        {
          guard: guards.isUnableToClaimError,
          target: DataConnectionStep.TryAgainCloseTabs,
        },
        {
          guard: always,
          target: DataConnectionStep.TryAgainReplugMicrobit,
        },
      ],
    },
  },

  [DataConnectionStep.ConnectBattery]: {
    on: {
      // After battery, transition to bridge phase
      next: {
        target: DataConnectionStep.ConnectCable,
        actions: actions.setBridgePhase,
      },
      back: { target: DataConnectionStep.WebUsbFlashingTutorial },
    },
  },

  [DataConnectionStep.ConnectingMicrobits]: {
    on: {
      ...createInitialConnectHandlers(),
    },
  },

  // Success state
  [DataConnectionStep.Connected]: {
    on: {
      connect: {
        target: DataConnectionStep.Start,
        actions: [...actions.reset, ...actions.setRemotePhase],
      },
      ...createConnectedHandlers(),
    },
  },

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    on: {
      connect: {
        target: DataConnectionStep.ConnectCable,
        actions: actions.setRemotePhase,
      },
      next: {
        target: DataConnectionStep.ConnectCable,
        actions: actions.setRemotePhase,
      },
      ...switchToWebBluetooth,
    },
  },

  ...badFirmwareState,
  ...webUsbTryAgainStates,
  ...createRecoveryStates(DataConnectionStep.ConnectingMicrobits, {
    type: "connectMicrobits",
  }),

  [DataConnectionStep.MicrobitUnsupported]: {
    on: {
      startBluetoothFlow: [
        {
          guard: guards.isWebBluetoothFlowSupported,
          target: DataConnectionStep.Start,
          actions: [
            {
              type: "setConnectionType",
              connectionType: DataConnectionType.WebBluetooth,
            },
          ],
        },
        { guard: always, target: DataConnectionStep.MicrobitUnsupported },
      ],
    },
  },

  ...webUsbBluetoothUnsupportedState,
};

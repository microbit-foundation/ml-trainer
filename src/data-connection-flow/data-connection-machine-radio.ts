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
  idleFreshStart,
  idleRadioReconnect,
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
      connect: [idleBrowserUnsupported, idleRadioReconnect, idleFreshStart],
    },
  },

  // Happy path: Start → ConnectCable → WebUsbFlashingTutorial → FlashingInProgress
  //           → ConnectBattery → ConnectCable → WebUsbFlashingTutorial → FlashingInProgress
  //           → ConnectingMicrobits → Connected
  [DataConnectionStep.Start]: {
    entry: actions.setRemotePhase,
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
      ...switchToWebBluetooth,
    },
  },

  ...webUsbFlashingTutorialState,

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      connectSuccess: [
        // Radio requires V2 for both remote and bridge micro:bits
        {
          guard: (ctx, event) => guards.isV1Board(ctx, event),
          target: DataConnectionStep.MicrobitUnsupported,
        },
        {
          guard: always,
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
          actions: [{ type: "setRadioRemoteDeviceId" }],
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
        actions: actions.reset,
      },
      ...createConnectedHandlers(),
    },
  },

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    entry: [
      { type: "setIsStartingOver", value: true },
      ...actions.setRemotePhase,
    ],
    on: {
      next: { target: DataConnectionStep.ConnectCable },
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

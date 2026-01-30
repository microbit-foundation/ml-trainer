/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  backToStartTransition,
  badFirmwareState,
  bluetoothRecoveryStates,
  connectedState,
  connectFlashSuccessHandler,
  createInitialConnectHandlers,
  createTryAgainState,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBluetoothReconnect,
  idleBrowserUnsupported,
  idleFreshStart,
  setMicrobitNameHandler,
  switchToRadio,
  webUsbBluetoothUnsupportedState,
  webUsbFlashingTutorialState,
} from "./data-connection-machine-common";
import { DataConnectionStep } from "./data-connection-types";
import { always } from "../state-machine";

export const webBluetoothFlow: DataConnectionFlowDef = {
  ...globalHandlers,

  // Entry point
  [DataConnectionStep.Idle]: {
    on: {
      connect: [idleBrowserUnsupported, idleBluetoothReconnect, idleFreshStart],
    },
  },

  // Happy path: Start → ConnectCable → WebUsbFlashingTutorial → FlashingInProgress
  //           → ConnectBattery → BluetoothPattern → WebBluetoothPreConnectTutorial
  //           → BluetoothConnect → Connected
  [DataConnectionStep.Start]: {
    on: {
      next: { target: DataConnectionStep.ConnectCable },
      ...switchToRadio,
    },
  },

  [DataConnectionStep.ConnectCable]: {
    on: {
      next: { target: DataConnectionStep.WebUsbFlashingTutorial },
      back: backToStartTransition,
      skip: { target: DataConnectionStep.ConnectBattery },
      ...switchToRadio,
    },
  },

  ...webUsbFlashingTutorialState,

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      ...connectFlashSuccessHandler,
      connectFlashFailure: [
        {
          guard: guards.isBadFirmwareError,
          target: DataConnectionStep.BadFirmware,
        },
        {
          guard: always,
          target: DataConnectionStep.ManualFlashingTutorial,
          actions: [{ type: "downloadHexFile" }],
        },
      ],
      flashSuccess: {
        target: DataConnectionStep.ConnectBattery,
        actions: [{ type: "setMicrobitName" }],
      },
      flashFailure: {
        target: DataConnectionStep.ManualFlashingTutorial,
        actions: [{ type: "downloadHexFile" }],
      },
    },
  },

  [DataConnectionStep.ManualFlashingTutorial]: {
    on: {
      next: { target: DataConnectionStep.ConnectBattery },
      back: { target: DataConnectionStep.ConnectCable },
    },
  },

  [DataConnectionStep.ConnectBattery]: {
    on: {
      next: { target: DataConnectionStep.EnterBluetoothPattern },
      back: { target: DataConnectionStep.WebUsbFlashingTutorial },
    },
  },

  [DataConnectionStep.EnterBluetoothPattern]: {
    on: {
      next: { target: DataConnectionStep.WebBluetoothPreConnectTutorial },
      back: { target: DataConnectionStep.ConnectBattery },
      ...setMicrobitNameHandler,
    },
  },

  [DataConnectionStep.WebBluetoothPreConnectTutorial]: {
    on: {
      next: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [{ type: "connectData", clearDevice: true }],
      },
      back: { target: DataConnectionStep.EnterBluetoothPattern },
    },
  },

  [DataConnectionStep.BluetoothConnect]: {
    on: {
      ...createInitialConnectHandlers({
        connectFlashFailureGuards: [
          {
            guard: guards.isNoDeviceSelectedError,
            target: DataConnectionStep.TryAgainBluetoothSelectMicrobit,
          },
        ],
      }),
    },
  },

  // Success state
  ...connectedState,

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    entry: [{ type: "setIsStartingOver", value: true }],
    on: {
      next: { target: DataConnectionStep.ConnectCable },
      ...switchToRadio,
    },
  },

  ...badFirmwareState,

  ...createTryAgainState(
    DataConnectionStep.TryAgainBluetoothSelectMicrobit,
    DataConnectionStep.EnterBluetoothPattern
  ),

  ...bluetoothRecoveryStates,

  ...webUsbBluetoothUnsupportedState,
};

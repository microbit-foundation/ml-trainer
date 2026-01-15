/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  badFirmwareState,
  connectedState,
  createInitialConnectHandlers,
  createRecoveryStates,
  createTryAgainState,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBluetoothReconnect,
  idleBrowserUnsupported,
  idleFreshStart,
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
      back: [
        {
          guard: guards.isStartingOver,
          target: DataConnectionStep.StartOver,
        },
        {
          guard: always,
          target: DataConnectionStep.Start,
        },
      ],
      skip: { target: DataConnectionStep.ConnectBattery },
      ...switchToRadio,
    },
  },

  ...webUsbFlashingTutorialState,

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      connectSuccess: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "flash" }],
      },
      connectFailure: [
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
        actions: [{ type: "setBluetoothName" }],
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
      next: { target: DataConnectionStep.BluetoothPattern },
      back: { target: DataConnectionStep.WebUsbFlashingTutorial },
    },
  },

  [DataConnectionStep.BluetoothPattern]: {
    on: {
      next: { target: DataConnectionStep.WebBluetoothPreConnectTutorial },
      back: { target: DataConnectionStep.ConnectBattery },
      setMicrobitName: {
        target: DataConnectionStep.BluetoothPattern,
        actions: [{ type: "setMicrobitName" }],
      },
    },
  },

  [DataConnectionStep.WebBluetoothPreConnectTutorial]: {
    on: {
      next: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [{ type: "connectBluetooth", clearDevice: true }],
      },
      back: { target: DataConnectionStep.BluetoothPattern },
    },
  },

  [DataConnectionStep.BluetoothConnect]: {
    on: {
      ...createInitialConnectHandlers({
        connectFailureGuards: [
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
    on: {
      connect: { target: DataConnectionStep.ConnectCable },
      next: { target: DataConnectionStep.ConnectCable },
      ...switchToRadio,
    },
  },

  ...badFirmwareState,

  ...createTryAgainState(
    DataConnectionStep.TryAgainBluetoothSelectMicrobit,
    DataConnectionStep.BluetoothPattern
  ),

  ...createRecoveryStates(DataConnectionStep.BluetoothConnect, {
    type: "connectBluetooth",
    clearDevice: false,
  }),

  ...webUsbBluetoothUnsupportedState,
};

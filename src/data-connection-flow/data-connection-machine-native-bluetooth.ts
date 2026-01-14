/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  actions,
  connectedState,
  createInitialConnectHandlers,
  createRecoveryStates,
  DataConnectionFlowDef,
  globalHandlers,
  guards,
  idleBluetoothReconnect,
  idleFreshStart,
} from "./data-connection-machine-common";
import { DataConnectionStep } from "./data-connection-types";
import { always } from "../state-machine";

export const nativeBluetoothFlow: DataConnectionFlowDef = {
  ...globalHandlers,

  // Entry point
  [DataConnectionStep.Idle]: {
    on: {
      connect: [idleBluetoothReconnect, idleFreshStart],
    },
  },

  // Happy path: Start → NativeBluetoothPreConnectTutorial → BluetoothPattern
  //           → FlashingInProgress → BluetoothConnect → Connected
  [DataConnectionStep.Start]: {
    on: {
      next: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
    },
  },

  [DataConnectionStep.NativeBluetoothPreConnectTutorial]: {
    on: {
      next: { target: DataConnectionStep.BluetoothPattern },
      back: [
        {
          guard: guards.hasFailedOnce,
          target: DataConnectionStep.StartOver,
        },
        {
          guard: always,
          target: DataConnectionStep.Start,
        },
      ],
    },
  },

  [DataConnectionStep.BluetoothPattern]: {
    on: {
      next: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "connect" }],
      },
      back: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
      setMicrobitName: {
        target: DataConnectionStep.BluetoothPattern,
        actions: [{ type: "setMicrobitName" }],
      },
    },
  },

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      connectSuccess: {
        target: DataConnectionStep.FlashingInProgress,
        actions: [{ type: "flash" }],
      },
      connectFailure: {
        target: DataConnectionStep.ConnectFailed,
      },
      flashSuccess: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [{ type: "connectBluetooth", clearDevice: true }],
      },
      flashFailure: {
        target: DataConnectionStep.ConnectFailed,
      },
    },
  },

  [DataConnectionStep.BluetoothConnect]: {
    on: {
      ...createInitialConnectHandlers(),
    },
  },

  // Success state
  ...connectedState,

  // Error/recovery states
  [DataConnectionStep.StartOver]: {
    on: {
      connect: {
        target: DataConnectionStep.NativeBluetoothPreConnectTutorial,
        actions: actions.reset,
      },
      next: {
        target: DataConnectionStep.NativeBluetoothPreConnectTutorial,
        actions: actions.reset,
      },
    },
  },

  ...createRecoveryStates(DataConnectionStep.BluetoothConnect, {
    type: "connectBluetooth",
    clearDevice: false,
  }),
};

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  backToStartTransition,
  connectedState,
  createInitialConnectHandlers,
  createRecoveryStates,
  DataConnectionFlowDef,
  globalHandlers,
  idleBluetoothReconnect,
  idleFreshStart,
} from "./data-connection-machine-common";
import { DataConnectionStep } from "./data-connection-types";

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
      back: backToStartTransition,
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
        actions: [{ type: "setMicrobitName" }],
      },
    },
  },

  [DataConnectionStep.FlashingInProgress]: {
    on: {
      connectSuccess: {
        actions: [{ type: "flash" }],
      },
      connectFailure: {
        target: DataConnectionStep.ConnectFailed,
      },
      flashSuccess: {
        target: DataConnectionStep.BluetoothConnect,
        actions: [{ type: "connectBluetooth", clearDevice: false }],
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
      connect: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
      next: { target: DataConnectionStep.NativeBluetoothPreConnectTutorial },
    },
  },

  ...createRecoveryStates(DataConnectionStep.BluetoothConnect, {
    type: "connectBluetooth",
    clearDevice: false,
  }),
};

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DataConnectionEvent,
  dataConnectionTransition,
} from "./data-connection-machine";
import {
  DataConnectionStep,
  DataConnectionType,
  DataConnectionState,
} from "./data-connection-types";

const createState = (
  overrides: Partial<DataConnectionState> = {}
): DataConnectionState => ({
  type: DataConnectionType.NativeBluetooth,
  step: DataConnectionStep.Idle,
  isWebBluetoothSupported: true,
  isWebUsbSupported: true,
  hadSuccessfulConnection: false,
  hasSwitchedConnectionType: false,
  isReconnecting: false,
  hasFailedOnce: false,
  isStartingOver: false,
  isBrowserTabVisible: true,
  ...overrides,
});

const connectEvent = (): DataConnectionEvent => ({
  type: "connect",
});

const transition = (
  step: DataConnectionStep,
  event: DataConnectionEvent,
  overrides: Partial<DataConnectionState> = {}
) => {
  return dataConnectionTransition(
    createState({
      type: DataConnectionType.NativeBluetooth,
      step,
      ...overrides,
    }),
    event
  );
};

describe("Data connection flow: Native Bluetooth", () => {
  describe("connect transitions from Idle", () => {
    it("goes to Start normally", () => {
      const result = transition(DataConnectionStep.Idle, connectEvent());

      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({ type: "reset" });
    });
  });

  describe("forward navigation", () => {
    it("Start -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.Start, { type: "next" });

      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
    });

    it("StartOver -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.StartOver, { type: "next" });

      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
    });

    it("NativeBluetoothPreConnectTutorial -> BluetoothPattern", () => {
      const result = transition(
        DataConnectionStep.NativeBluetoothPreConnectTutorial,
        { type: "next" }
      );

      expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
    });

    it("BluetoothPattern -> FlashingInProgress with connect action", () => {
      const result = transition(DataConnectionStep.BluetoothPattern, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "connect" });
    });
  });

  describe("back navigation coherence", () => {
    it("NativeBluetoothPreConnectTutorial back -> Start (normal case)", () => {
      const result = transition(
        DataConnectionStep.NativeBluetoothPreConnectTutorial,
        { type: "back" }
      );

      expect(result?.step).toBe(DataConnectionStep.Start);
    });

    it("NativeBluetoothPreConnectTutorial back -> StartOver (when isStartingOver)", () => {
      const result = transition(
        DataConnectionStep.NativeBluetoothPreConnectTutorial,
        { type: "back" },
        { isStartingOver: true }
      );

      expect(result?.step).toBe(DataConnectionStep.StartOver);
    });

    it("BluetoothPattern back -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.BluetoothPattern, {
        type: "back",
      });

      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
    });
  });

  describe("flashing outcomes", () => {
    it("connectSuccess -> FlashingInProgress with flash action", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectSuccess",
      });

      expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "flash" });
    });

    it("connectFailure -> ConnectFailed", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
    });

    it("flashSuccess -> BluetoothConnect with connectBluetooth action", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "connectBluetooth",
        clearDevice: false,
      });
    });

    it("flashFailure -> ConnectFailed", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "flashFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
    });
  });

  describe("bluetooth connection outcomes", () => {
    it("deviceConnected -> Connected with notifyConnected", () => {
      const result = transition(DataConnectionStep.BluetoothConnect, {
        type: "deviceConnected",
      });

      expect(result?.step).toBe(DataConnectionStep.Connected);
      expect(result?.actions).toContainEqual({ type: "notifyConnected" });
      expect(result?.actions).toContainEqual({
        type: "setConnected",
      });
    });

    it("deviceDisconnected on first attempt -> ConnectFailed", () => {
      const result = transition(
        DataConnectionStep.BluetoothConnect,
        { type: "deviceDisconnected" },
        { hasFailedOnce: false }
      );

      expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
      expect(result?.actions).toContainEqual({
        type: "setReconnecting",
        value: false,
      });
    });
  });

  describe("error recovery", () => {
    it("ConnectFailed next -> BluetoothConnect with status and connectBluetooth", () => {
      const result = transition(DataConnectionStep.ConnectFailed, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "setReconnecting",
        value: true,
      });
      expect(result?.actions).toContainEqual({
        type: "connectBluetooth",
        clearDevice: false,
      });
    });

    it("ConnectionLost next -> BluetoothConnect with status and connectBluetooth", () => {
      const result = transition(DataConnectionStep.ConnectionLost, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "setReconnecting",
        value: true,
      });
      expect(result?.actions).toContainEqual({
        type: "connectBluetooth",
        clearDevice: false,
      });
    });
  });

  describe("close from any step", () => {
    const stepsWithClose = [
      DataConnectionStep.Start,
      DataConnectionStep.StartOver,
      DataConnectionStep.NativeBluetoothPreConnectTutorial,
      DataConnectionStep.BluetoothPattern,
      DataConnectionStep.ConnectFailed,
      DataConnectionStep.ConnectionLost,
    ];

    stepsWithClose.forEach((step) => {
      it(`${step} close -> None`, () => {
        const result = transition(step, { type: "close" });
        expect(result?.step).toBe(DataConnectionStep.Idle);
      });
    });
  });
});

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
  isCheckingPermissions: false,
  pairingMethod: "triple-reset",
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
    it("Start next -> triggers checkPermissions", () => {
      const result = transition(DataConnectionStep.Start, { type: "next" });

      // Stay in Start while checking permissions (no step change in transition)
      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({ type: "checkPermissions" });
    });

    it("Start permissionsOk -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "permissionsOk",
      });

      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
    });

    it("Start bluetoothDisabled -> BluetoothDisabled", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "bluetoothDisabled",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothDisabled);
    });

    it("Start permissionDenied -> BluetoothPermissionDenied", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "permissionDenied",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothPermissionDenied);
    });

    it("Start locationDisabled -> LocationDisabled", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "locationDisabled",
      });

      expect(result?.step).toBe(DataConnectionStep.LocationDisabled);
    });

    it("StartOver next -> triggers checkPermissions", () => {
      const result = transition(DataConnectionStep.StartOver, { type: "next" });

      // Stay in StartOver while checking permissions
      expect(result?.step).toBe(DataConnectionStep.StartOver);
      expect(result?.actions).toContainEqual({ type: "checkPermissions" });
    });

    it("StartOver permissionsOk -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.StartOver, {
        type: "permissionsOk",
      });

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

    it("NativeBluetoothPreConnectTutorial switchPairingMethod -> internal transition with toggle", () => {
      const result = transition(
        DataConnectionStep.NativeBluetoothPreConnectTutorial,
        { type: "switchPairingMethod" }
      );

      // Internal transition - stays in same step
      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
      expect(result?.actions).toContainEqual({ type: "togglePairingMethod" });
    });

    it("BluetoothPattern next -> FlashingInProgress with connectFlash", () => {
      const result = transition(DataConnectionStep.BluetoothPattern, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "connectFlash" });
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
    it("connectFlashSuccess -> FlashingInProgress with flash action", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashSuccess",
      });

      expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "flash" });
    });

    it("connectFlashFailure -> ConnectFailed for generic errors", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
    });

    it("connectFlashFailure with disabled code -> BluetoothDisabled", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "disabled",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothDisabled);
    });

    it("connectFlashFailure with permission-denied code -> BluetoothPermissionDenied", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "permission-denied",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothPermissionDenied);
    });

    it("connectFlashFailure with location-disabled code -> LocationDisabled", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "location-disabled",
      });

      expect(result?.step).toBe(DataConnectionStep.LocationDisabled);
    });

    it("flashSuccess -> BluetoothConnect with connectData action", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({ type: "connectData" });
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

  describe("permission error recovery", () => {
    it("BluetoothDisabled tryAgain -> internal transition with checkPermissions", () => {
      const result = transition(DataConnectionStep.BluetoothDisabled, {
        type: "tryAgain",
      });

      // Stays in same state while checking permissions
      expect(result?.step).toBe(DataConnectionStep.BluetoothDisabled);
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: true,
      });
      expect(result?.actions).toContainEqual({ type: "checkPermissions" });
    });

    it("BluetoothDisabled permissionsOk -> NativeBluetoothPreConnectTutorial", () => {
      // Always goes to tutorial after permission recovery.
      // Stored name (if any) will be pre-filled there.
      const result = transition(DataConnectionStep.BluetoothDisabled, {
        type: "permissionsOk",
      });

      expect(result?.step).toBe(
        DataConnectionStep.NativeBluetoothPreConnectTutorial
      );
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: false,
      });
    });

    it("BluetoothDisabled bluetoothDisabled -> stays in BluetoothDisabled", () => {
      const result = transition(DataConnectionStep.BluetoothDisabled, {
        type: "bluetoothDisabled",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothDisabled);
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: false,
      });
    });

    it("BluetoothDisabled permissionDenied -> BluetoothPermissionDenied", () => {
      const result = transition(DataConnectionStep.BluetoothDisabled, {
        type: "permissionDenied",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothPermissionDenied);
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: false,
      });
    });

    it("BluetoothPermissionDenied tryAgain -> internal transition with checkPermissions", () => {
      const result = transition(DataConnectionStep.BluetoothPermissionDenied, {
        type: "tryAgain",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothPermissionDenied);
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: true,
      });
      expect(result?.actions).toContainEqual({ type: "checkPermissions" });
    });

    it("LocationDisabled tryAgain -> internal transition with checkPermissions", () => {
      const result = transition(DataConnectionStep.LocationDisabled, {
        type: "tryAgain",
      });

      expect(result?.step).toBe(DataConnectionStep.LocationDisabled);
      expect(result?.actions).toContainEqual({
        type: "setCheckingPermissions",
        value: true,
      });
      expect(result?.actions).toContainEqual({ type: "checkPermissions" });
    });
  });

  describe("error recovery", () => {
    it("ConnectFailed next -> BluetoothConnect with status and connectData", () => {
      const result = transition(DataConnectionStep.ConnectFailed, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "setReconnecting",
        value: true,
      });
      expect(result?.actions).toContainEqual({ type: "connectData" });
    });

    it("ConnectionLost next -> BluetoothConnect with status and connectData", () => {
      const result = transition(DataConnectionStep.ConnectionLost, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "setReconnecting",
        value: true,
      });
      expect(result?.actions).toContainEqual({ type: "connectData" });
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
      DataConnectionStep.BluetoothDisabled,
      DataConnectionStep.BluetoothPermissionDenied,
      DataConnectionStep.LocationDisabled,
    ];

    stepsWithClose.forEach((step) => {
      it(`${step} close -> None`, () => {
        const result = transition(step, { type: "close" });
        expect(result?.step).toBe(DataConnectionStep.Idle);
      });
    });
  });
});

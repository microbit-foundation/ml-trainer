/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  DataConnectionEvent,
  DataConnectionFlowContext,
  dataConnectionTransition,
} from "./data-connection-machine";
import {
  DataConnectionStep,
  DataConnectionType,
} from "./data-connection-types";

const createContext = (
  overrides: Partial<DataConnectionFlowContext> = {}
): DataConnectionFlowContext => ({
  type: DataConnectionType.WebBluetooth,
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
  connectionAbortController: undefined,
  bluetoothMicrobitName: undefined,
  isDeviceBonded: false,
  ...overrides,
});

const connectEvent = (): DataConnectionEvent => ({
  type: "connect",
});

const transition = (
  step: DataConnectionStep,
  event: DataConnectionEvent,
  overrides: Partial<DataConnectionFlowContext> = {}
) => {
  return dataConnectionTransition(
    createContext({
      type: DataConnectionType.WebBluetooth,
      step,
      ...overrides,
    }),
    event
  );
};

describe("Data connection flow: Web Bluetooth", () => {
  describe("connect transitions from Idle", () => {
    it("goes to WebUsbBluetoothUnsupported if neither Web Bluetooth nor WebUSB is supported", () => {
      const result = transition(DataConnectionStep.Idle, connectEvent(), {
        isWebBluetoothSupported: false,
        isWebUsbSupported: false,
      });

      expect(result?.step).toBe(DataConnectionStep.WebUsbBluetoothUnsupported);
    });

    it("goes to Start normally", () => {
      const result = transition(DataConnectionStep.Idle, connectEvent());

      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({ type: "reset" });
    });
  });

  describe("forward navigation", () => {
    it("Start -> ConnectCable", () => {
      const result = transition(DataConnectionStep.Start, { type: "next" });

      expect(result?.step).toBe(DataConnectionStep.ConnectCable);
    });

    it("StartOver -> ConnectCable", () => {
      const result = transition(DataConnectionStep.StartOver, { type: "next" });

      expect(result?.step).toBe(DataConnectionStep.ConnectCable);
    });

    it("ConnectCable -> WebUsbFlashingTutorial", () => {
      const result = transition(DataConnectionStep.ConnectCable, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
    });

    it("WebUsbFlashingTutorial -> FlashingInProgress with connectFlash action", () => {
      const result = transition(DataConnectionStep.WebUsbFlashingTutorial, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "connectFlash" });
    });

    it("ManualFlashingTutorial -> ConnectBattery", () => {
      const result = transition(DataConnectionStep.ManualFlashingTutorial, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
    });

    it("ConnectBattery -> BluetoothPattern", () => {
      const result = transition(DataConnectionStep.ConnectBattery, {
        type: "next",
      });

      expect(result?.step).toBe(DataConnectionStep.EnterBluetoothPattern);
    });

    it("BluetoothPattern -> WebBluetoothPreConnectTutorial", () => {
      const result = transition(DataConnectionStep.EnterBluetoothPattern, {
        type: "next",
      });

      expect(result?.step).toBe(
        DataConnectionStep.WebBluetoothPreConnectTutorial
      );
    });

    it("WebBluetoothPreConnectTutorial -> BluetoothConnect with connectData action", () => {
      const result = transition(
        DataConnectionStep.WebBluetoothPreConnectTutorial,
        { type: "next" }
      );

      expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
      expect(result?.actions).toContainEqual({
        type: "connectData",
        clearDevice: true,
      });
    });

    it("BluetoothPattern setMicrobitName -> stays on BluetoothPattern with setMicrobitName action", () => {
      const result = transition(DataConnectionStep.EnterBluetoothPattern, {
        type: "setMicrobitName",
        name: "zogup",
      });

      expect(result?.step).toBe(DataConnectionStep.EnterBluetoothPattern);
      expect(result?.actions).toContainEqual({ type: "setMicrobitName" });
    });
  });

  describe("back navigation coherence", () => {
    it("ConnectCable back -> Start (normal case)", () => {
      const result = transition(DataConnectionStep.ConnectCable, {
        type: "back",
      });

      expect(result?.step).toBe(DataConnectionStep.Start);
    });

    it("ConnectCable back -> StartOver (when isStartingOver)", () => {
      const result = transition(
        DataConnectionStep.ConnectCable,
        { type: "back" },
        { isStartingOver: true }
      );

      expect(result?.step).toBe(DataConnectionStep.StartOver);
    });

    it("WebUsbFlashingTutorial back -> ConnectCable", () => {
      const result = transition(DataConnectionStep.WebUsbFlashingTutorial, {
        type: "back",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectCable);
    });

    it("ManualFlashingTutorial back -> ConnectCable", () => {
      const result = transition(DataConnectionStep.ManualFlashingTutorial, {
        type: "back",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectCable);
    });

    it("ConnectBattery back -> WebUsbFlashingTutorial", () => {
      const result = transition(DataConnectionStep.ConnectBattery, {
        type: "back",
      });

      expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
    });

    it("BluetoothPattern back -> ConnectBattery", () => {
      const result = transition(DataConnectionStep.EnterBluetoothPattern, {
        type: "back",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
    });

    it("WebBluetoothPreConnectTutorial back -> BluetoothPattern", () => {
      const result = transition(
        DataConnectionStep.WebBluetoothPreConnectTutorial,
        { type: "back" }
      );

      expect(result?.step).toBe(DataConnectionStep.EnterBluetoothPattern);
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

    it("connectFlashFailure with bad firmware -> BadFirmware", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "update-req",
      });

      expect(result?.step).toBe(DataConnectionStep.BadFirmware);
    });

    it("connectFlashFailure (other) -> ManualFlashingTutorial with downloadHexFile", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DataConnectionStep.ManualFlashingTutorial);
      expect(result?.actions).toContainEqual({ type: "downloadHexFile" });
    });

    it("flashSuccess -> ConnectBattery with bluetooth name/id actions", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
      expect(result?.actions).toContainEqual({ type: "setMicrobitName" });
    });

    it("flashFailure -> ManualFlashingTutorial with downloadHexFile", () => {
      const result = transition(DataConnectionStep.FlashingInProgress, {
        type: "flashFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DataConnectionStep.ManualFlashingTutorial);
      expect(result?.actions).toContainEqual({ type: "downloadHexFile" });
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

    it("connectDataFailure (no device selected) -> TryAgainBluetoothSelectMicrobit", () => {
      const result = transition(DataConnectionStep.BluetoothConnect, {
        type: "connectDataFailure",
        code: "no-device-selected",
      });

      expect(result?.step).toBe(
        DataConnectionStep.TryAgainBluetoothSelectMicrobit
      );
      expect(result?.actions).toEqual([]);
    });
  });

  describe("switch flow type", () => {
    it("Start switchFlowType -> stays at Start with setFlowType to radio", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "switchFlowType",
      });

      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({
        type: "setConnectionType",
        connectionType: DataConnectionType.Radio,
      });
    });

    it("StartOver switchFlowType -> goes to Start with setFlowType to radio", () => {
      const result = transition(DataConnectionStep.StartOver, {
        type: "switchFlowType",
      });

      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({
        type: "setConnectionType",
        connectionType: DataConnectionType.Radio,
      });
    });

    it("ConnectCable switchFlowType -> goes to Start with setFlowType to radio", () => {
      const result = transition(DataConnectionStep.ConnectCable, {
        type: "switchFlowType",
      });

      expect(result?.step).toBe(DataConnectionStep.Start);
      expect(result?.actions).toContainEqual({
        type: "setConnectionType",
        connectionType: DataConnectionType.Radio,
      });
    });

    it("switchFlowType sets connection type", () => {
      const result = transition(DataConnectionStep.Start, {
        type: "switchFlowType",
      });

      expect(result?.actions).toContainEqual({
        type: "setConnectionType",
        connectionType: DataConnectionType.Radio,
      });
    });
  });

  describe("skip", () => {
    it("ConnectCable skip -> ConnectBattery", () => {
      const result = transition(DataConnectionStep.ConnectCable, {
        type: "skip",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
    });
  });

  describe("error recovery", () => {
    it("BadFirmware tryAgain -> ConnectCable", () => {
      const result = transition(DataConnectionStep.BadFirmware, {
        type: "tryAgain",
      });

      expect(result?.step).toBe(DataConnectionStep.ConnectCable);
    });

    it("TryAgainBluetoothSelectMicrobit tryAgain -> BluetoothPattern", () => {
      const result = transition(
        DataConnectionStep.TryAgainBluetoothSelectMicrobit,
        { type: "tryAgain" }
      );

      expect(result?.step).toBe(DataConnectionStep.EnterBluetoothPattern);
    });

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
      DataConnectionStep.ConnectCable,
      DataConnectionStep.WebUsbFlashingTutorial,
      DataConnectionStep.ManualFlashingTutorial,
      DataConnectionStep.ConnectBattery,
      DataConnectionStep.EnterBluetoothPattern,
      DataConnectionStep.WebBluetoothPreConnectTutorial,
      DataConnectionStep.BadFirmware,
      DataConnectionStep.TryAgainBluetoothSelectMicrobit,
      DataConnectionStep.ConnectFailed,
      DataConnectionStep.ConnectionLost,
      DataConnectionStep.WebUsbBluetoothUnsupported,
    ];

    stepsWithClose.forEach((step) => {
      it(`${step} close -> None`, () => {
        const result = transition(step, { type: "close" });
        expect(result?.step).toBe(DataConnectionStep.Idle);
      });
    });
  });
});

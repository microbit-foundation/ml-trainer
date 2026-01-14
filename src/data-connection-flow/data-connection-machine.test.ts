/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ConnectResult } from "../connection-service";
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
  type: DataConnectionType.WebBluetooth,
  step: DataConnectionStep.Idle,
  isWebBluetoothSupported: true,
  isWebUsbSupported: true,
  hadSuccessfulConnection: false,
  hasSwitchedConnectionType: false,
  isReconnecting: false,
  hasFailedOnce: false,
  isBrowserTabVisible: true,
  ...overrides,
});

/**
 * Create a connect event.
 */
const connectEvent = (): DataConnectionEvent => ({
  type: "connect",
});

const transition = (
  connectionType: DataConnectionType,
  step: DataConnectionStep,
  event: DataConnectionEvent,
  overrides: Partial<DataConnectionState> = {}
) => {
  return dataConnectionTransition(
    createState({ type: connectionType, step, ...overrides }),
    event
  );
};

describe("data-connection-machine", () => {
  describe("webBluetoothFlow", () => {
    const flow = DataConnectionType.WebBluetooth;

    describe("connect transitions from Idle", () => {
      it("goes to WebUsbBluetoothUnsupported if neither Web Bluetooth nor WebUSB is supported", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent(),
          {
            isWebBluetoothSupported: false,
            isWebUsbSupported: false,
          }
        );

        expect(result?.step).toBe(
          DataConnectionStep.WebUsbBluetoothUnsupported
        );
      });

      it("goes to Start normally", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent()
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({ type: "reset" });
      });
    });

    describe("forward navigation", () => {
      it("Start -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.Start, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("StartOver -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.StartOver, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ConnectCable -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
      });

      it("WebUsbFlashingTutorial -> FlashingInProgress with connect action", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });

      it("ManualFlashingTutorial -> ConnectBattery", () => {
        const result = transition(
          flow,
          DataConnectionStep.ManualFlashingTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
      });

      it("ConnectBattery -> BluetoothPattern", () => {
        const result = transition(flow, DataConnectionStep.ConnectBattery, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
      });

      it("BluetoothPattern -> WebBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DataConnectionStep.BluetoothPattern, {
          type: "next",
        });

        expect(result?.step).toBe(
          DataConnectionStep.WebBluetoothPreConnectTutorial
        );
      });

      it("WebBluetoothPreConnectTutorial -> BluetoothConnect with connectBluetooth action", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebBluetoothPreConnectTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
        expect(result?.actions).toContainEqual({
          type: "connectBluetooth",
          clearDevice: true,
        });
      });

      it("BluetoothPattern setMicrobitName -> stays on BluetoothPattern with setMicrobitName action", () => {
        const result = transition(flow, DataConnectionStep.BluetoothPattern, {
          type: "setMicrobitName",
          name: "zogup",
        });

        expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
        expect(result?.actions).toContainEqual({ type: "setMicrobitName" });
      });
    });

    describe("back navigation coherence", () => {
      it("ConnectCable back -> Start (normal case)", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "back",
        });

        expect(result?.step).toBe(DataConnectionStep.Start);
      });

      it("ConnectCable back -> StartOver (when hasFailedOnce)", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectCable,
          { type: "back" },
          { hasFailedOnce: true }
        );

        expect(result?.step).toBe(DataConnectionStep.StartOver);
      });

      it("WebUsbFlashingTutorial back -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ManualFlashingTutorial back -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.ManualFlashingTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ConnectBattery back -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DataConnectionStep.ConnectBattery, {
          type: "back",
        });

        expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
      });

      it("BluetoothPattern back -> ConnectBattery", () => {
        const result = transition(flow, DataConnectionStep.BluetoothPattern, {
          type: "back",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
      });

      it("WebBluetoothPreConnectTutorial back -> BluetoothPattern", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebBluetoothPreConnectTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> FlashingInProgress with flash action", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "flash" });
      });

      it("connectFailure with bad firmware -> BadFirmware", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorBadFirmware,
        });

        expect(result?.step).toBe(DataConnectionStep.BadFirmware);
      });

      it("connectFailure (other) -> ManualFlashingTutorial with downloadHex", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.ManualFlashingTutorial);
        expect(result?.actions).toContainEqual({ type: "downloadHex" });
      });

      it("flashSuccess -> ConnectBattery with bluetooth name/id actions", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
        expect(result?.actions).toContainEqual({ type: "setBluetoothName" });
        expect(result?.actions).toContainEqual({
          type: "setBluetoothDeviceId",
        });
      });

      it("flashFailure -> ManualFlashingTutorial with downloadHex", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.ManualFlashingTutorial);
        expect(result?.actions).toContainEqual({ type: "downloadHex" });
      });
    });

    describe("bluetooth connection outcomes", () => {
      it("deviceConnected -> Connected with notifyConnected", () => {
        const result = transition(flow, DataConnectionStep.BluetoothConnect, {
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
          flow,
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

      it("deviceNoAuthorizedDevice -> TryAgainBluetoothSelectMicrobit", () => {
        const result = transition(flow, DataConnectionStep.BluetoothConnect, {
          type: "deviceNoAuthorizedDevice",
        });

        expect(result?.step).toBe(
          DataConnectionStep.TryAgainBluetoothSelectMicrobit
        );
        expect(result?.actions).toEqual([]);
      });
    });

    describe("switch flow type", () => {
      it("Start switchFlowType -> stays at Start with setFlowType to radio", () => {
        const result = transition(flow, DataConnectionStep.Start, {
          type: "switchFlowType",
        });

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.Radio,
        });
      });

      it("StartOver switchFlowType -> goes to Start with setFlowType to radio", () => {
        const result = transition(flow, DataConnectionStep.StartOver, {
          type: "switchFlowType",
        });

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.Radio,
        });
      });

      it("ConnectCable switchFlowType -> goes to Start with setFlowType to radio", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "switchFlowType",
        });

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.Radio,
        });
      });

      it("switchFlowType sets connection type", () => {
        const result = transition(flow, DataConnectionStep.Start, {
          type: "switchFlowType",
        });

        // setConnectionType now internally sets hasSwitchedConnectionType
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.Radio,
        });
      });
    });

    describe("skip", () => {
      it("ConnectCable skip -> ConnectBattery", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "skip",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
      });
    });

    describe("error recovery", () => {
      it("BadFirmware tryAgain -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.BadFirmware, {
          type: "tryAgain",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainBluetoothSelectMicrobit tryAgain -> BluetoothPattern", () => {
        const result = transition(
          flow,
          DataConnectionStep.TryAgainBluetoothSelectMicrobit,
          { type: "tryAgain" }
        );

        expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
      });

      it("ConnectFailed next -> BluetoothConnect with status and connectBluetooth", () => {
        const result = transition(flow, DataConnectionStep.ConnectFailed, {
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
        const result = transition(flow, DataConnectionStep.ConnectionLost, {
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
        DataConnectionStep.ConnectCable,
        DataConnectionStep.WebUsbFlashingTutorial,
        DataConnectionStep.ManualFlashingTutorial,
        DataConnectionStep.ConnectBattery,
        DataConnectionStep.BluetoothPattern,
        DataConnectionStep.WebBluetoothPreConnectTutorial,
        DataConnectionStep.BadFirmware,
        DataConnectionStep.TryAgainBluetoothSelectMicrobit,
        DataConnectionStep.ConnectFailed,
        DataConnectionStep.ConnectionLost,
        DataConnectionStep.WebUsbBluetoothUnsupported,
      ];

      stepsWithClose.forEach((step) => {
        it(`${step} close -> None`, () => {
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DataConnectionStep.Idle);
        });
      });
    });
  });

  describe("nativeBluetoothFlow", () => {
    const flow = DataConnectionType.NativeBluetooth;

    describe("connect transitions from Idle", () => {
      it("goes to Start normally", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent()
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({ type: "reset" });
      });
    });

    describe("forward navigation", () => {
      it("Start -> NativeBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DataConnectionStep.Start, {
          type: "next",
        });

        expect(result?.step).toBe(
          DataConnectionStep.NativeBluetoothPreConnectTutorial
        );
      });

      it("StartOver -> NativeBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DataConnectionStep.StartOver, {
          type: "next",
        });

        expect(result?.step).toBe(
          DataConnectionStep.NativeBluetoothPreConnectTutorial
        );
      });

      it("NativeBluetoothPreConnectTutorial -> BluetoothPattern", () => {
        const result = transition(
          flow,
          DataConnectionStep.NativeBluetoothPreConnectTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.BluetoothPattern);
      });

      it("BluetoothPattern -> FlashingInProgress with connect action", () => {
        const result = transition(flow, DataConnectionStep.BluetoothPattern, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });
    });

    describe("back navigation coherence", () => {
      it("NativeBluetoothPreConnectTutorial back -> Start (normal case)", () => {
        const result = transition(
          flow,
          DataConnectionStep.NativeBluetoothPreConnectTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
      });

      it("NativeBluetoothPreConnectTutorial back -> StartOver (when hasFailedOnce)", () => {
        const result = transition(
          flow,
          DataConnectionStep.NativeBluetoothPreConnectTutorial,
          { type: "back" },
          { hasFailedOnce: true }
        );

        expect(result?.step).toBe(DataConnectionStep.StartOver);
      });

      it("BluetoothPattern back -> NativeBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DataConnectionStep.BluetoothPattern, {
          type: "back",
        });

        expect(result?.step).toBe(
          DataConnectionStep.NativeBluetoothPreConnectTutorial
        );
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> FlashingInProgress with flash action", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "flash" });
      });

      it("connectFailure -> ConnectFailed", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
      });

      it("flashSuccess -> BluetoothConnect with connectBluetooth action", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.BluetoothConnect);
        expect(result?.actions).toContainEqual({
          type: "connectBluetooth",
          clearDevice: true,
        });
      });

      it("flashFailure -> ConnectFailed", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectFailed);
      });
    });

    describe("bluetooth connection outcomes", () => {
      it("deviceConnected -> Connected with notifyConnected", () => {
        const result = transition(flow, DataConnectionStep.BluetoothConnect, {
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
          flow,
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
        const result = transition(flow, DataConnectionStep.ConnectFailed, {
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
        const result = transition(flow, DataConnectionStep.ConnectionLost, {
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
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DataConnectionStep.Idle);
        });
      });
    });
  });

  describe("radioRemoteFlow", () => {
    const flow = DataConnectionType.Radio;

    describe("connect transitions from Idle", () => {
      it("goes to WebUsbBluetoothUnsupported if neither Web Bluetooth nor WebUSB is supported", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent(),
          {
            isWebBluetoothSupported: false,
            isWebUsbSupported: false,
          }
        );

        expect(result?.step).toBe(
          DataConnectionStep.WebUsbBluetoothUnsupported
        );
      });

      it("goes to Start normally", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent()
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({ type: "reset" });
      });
    });

    describe("forward navigation", () => {
      it("Start -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.Start, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("StartOver -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.StartOver, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ConnectCable -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
      });

      it("WebUsbFlashingTutorial -> FlashingInProgress with connect action", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });

      it("ConnectBattery -> switches to bridge phase", () => {
        const result = transition(flow, DataConnectionStep.ConnectBattery, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
        expect(result?.actions).toContainEqual({
          type: "setRadioFlowPhase",
          phase: "bridge",
        });
      });
    });

    describe("back navigation coherence", () => {
      it("ConnectCable back -> Start (normal case)", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "back",
        });

        expect(result?.step).toBe(DataConnectionStep.Start);
      });

      it("ConnectCable back -> StartOver (when hasFailedOnce)", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectCable,
          { type: "back" },
          { hasFailedOnce: true }
        );

        expect(result?.step).toBe(DataConnectionStep.StartOver);
      });

      it("WebUsbFlashingTutorial back -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ConnectBattery back -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DataConnectionStep.ConnectBattery, {
          type: "back",
        });

        expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess (V2 board) -> FlashingInProgress with flash action", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "flash" });
      });

      it("connectSuccess (V1 board) -> MicrobitUnsupported", () => {
        const result = transition(
          flow,
          DataConnectionStep.FlashingInProgress,
          { type: "connectSuccess" },
          { radioRemoteBoardVersion: "V1" }
        );

        expect(result?.step).toBe(DataConnectionStep.MicrobitUnsupported);
      });

      it("connectFailure with bad firmware -> BadFirmware", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorBadFirmware,
        });

        expect(result?.step).toBe(DataConnectionStep.BadFirmware);
      });

      it("connectFailure with no device selected -> TryAgainWebUsbSelectMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorNoDeviceSelected,
        });

        expect(result?.step).toBe(
          DataConnectionStep.TryAgainWebUsbSelectMicrobit
        );
      });

      it("connectFailure with unable to claim -> TryAgainCloseTabs", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorUnableToClaimInterface,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainCloseTabs);
      });

      it("connectFailure (other) -> TryAgainReplugMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainReplugMicrobit);
      });

      it("flashSuccess -> ConnectBattery with device id and board version", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
        expect(result?.actions).toContainEqual({
          type: "setRadioRemoteDeviceId",
        });
        expect(result?.actions).toContainEqual({ type: "setBoardVersion" });
      });

      it("flashFailure with no device selected -> TryAgainWebUsbSelectMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.ErrorNoDeviceSelected,
        });

        expect(result?.step).toBe(
          DataConnectionStep.TryAgainWebUsbSelectMicrobit
        );
      });

      it("flashFailure with unable to claim -> TryAgainCloseTabs", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.ErrorUnableToClaimInterface,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainCloseTabs);
      });

      it("flashFailure (other) -> TryAgainReplugMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainReplugMicrobit);
      });
    });

    describe("switch flow type", () => {
      it("Start switchFlowType -> stays at Start with setFlowType to WebBluetooth (if supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.Start,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: true }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.WebBluetooth,
        });
      });

      it("Start switchFlowType -> ignored if WebBluetooth not supported", () => {
        const result = transition(
          flow,
          DataConnectionStep.Start,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: false }
        );

        expect(result).toBeNull();
      });

      it("StartOver switchFlowType -> goes to Start with setFlowType to WebBluetooth (if supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.StartOver,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: true }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.WebBluetooth,
        });
      });

      it("StartOver switchFlowType -> ignored if WebBluetooth not supported", () => {
        const result = transition(
          flow,
          DataConnectionStep.StartOver,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: false }
        );

        expect(result).toBeNull();
      });

      it("ConnectCable switchFlowType -> goes to Start with setFlowType to WebBluetooth (if supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectCable,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: true }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.WebBluetooth,
        });
      });

      it("ConnectCable switchFlowType -> ignored if WebBluetooth not supported", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectCable,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: false }
        );

        expect(result).toBeNull();
      });

      it("switchFlowType sets connection type (when WebBluetooth supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.Start,
          { type: "switchFlowType" },
          { isWebBluetoothSupported: true }
        );

        // setConnectionType now internally sets hasSwitchedConnectionType
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.WebBluetooth,
        });
      });
    });

    describe("error recovery", () => {
      it("BadFirmware tryAgain -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.BadFirmware, {
          type: "tryAgain",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainReplugMicrobit tryAgain -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.TryAgainReplugMicrobit,
          { type: "tryAgain" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainCloseTabs tryAgain -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.TryAgainCloseTabs, {
          type: "tryAgain",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainWebUsbSelectMicrobit tryAgain -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.TryAgainWebUsbSelectMicrobit,
          { type: "tryAgain" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("MicrobitUnsupported startBluetoothFlow -> Start with WebBluetooth flow type (if supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.MicrobitUnsupported,
          { type: "startBluetoothFlow" },
          { isWebBluetoothSupported: true }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setConnectionType",
          connectionType: DataConnectionType.WebBluetooth,
        });
      });

      it("MicrobitUnsupported startBluetoothFlow -> stays at MicrobitUnsupported (if not supported)", () => {
        const result = transition(
          flow,
          DataConnectionStep.MicrobitUnsupported,
          { type: "startBluetoothFlow" },
          { isWebBluetoothSupported: false }
        );

        expect(result?.step).toBe(DataConnectionStep.MicrobitUnsupported);
      });
    });

    describe("close from any step", () => {
      const stepsWithClose = [
        DataConnectionStep.Start,
        DataConnectionStep.StartOver,
        DataConnectionStep.ConnectCable,
        DataConnectionStep.WebUsbFlashingTutorial,
        DataConnectionStep.ConnectBattery,
        DataConnectionStep.BadFirmware,
        DataConnectionStep.TryAgainReplugMicrobit,
        DataConnectionStep.TryAgainCloseTabs,
        DataConnectionStep.TryAgainWebUsbSelectMicrobit,
        DataConnectionStep.MicrobitUnsupported,
        DataConnectionStep.WebUsbBluetoothUnsupported,
      ];

      stepsWithClose.forEach((step) => {
        it(`${step} close -> None`, () => {
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DataConnectionStep.Idle);
        });
      });
    });
  });

  describe("radioFlow bridge phase", () => {
    const flow = DataConnectionType.Radio;

    describe("connect transitions from Idle", () => {
      it("goes to Start and sets remote phase when starting fresh", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent(),
          { hadSuccessfulConnection: false }
        );

        expect(result?.step).toBe(DataConnectionStep.Start);
        expect(result?.actions).toContainEqual({
          type: "setRadioFlowPhase",
          phase: "remote",
        });
        expect(result?.actions).toContainEqual({ type: "reset" });
      });

      it("goes to ConnectingMicrobits when hadSuccessfulConnection", () => {
        const result = transition(
          flow,
          DataConnectionStep.Idle,
          connectEvent(),
          { hadSuccessfulConnection: true }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectingMicrobits);
        expect(result?.actions).toContainEqual({ type: "connectMicrobits" });
      });
    });

    describe("forward navigation", () => {
      it("ConnectCable -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DataConnectionStep.ConnectCable, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.WebUsbFlashingTutorial);
      });

      it("WebUsbFlashingTutorial -> FlashingInProgress with connect action", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });
    });

    describe("back navigation coherence", () => {
      it("ConnectCable back in bridge phase -> ConnectBattery with remote phase", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectCable,
          { type: "back" },
          { radioFlowPhase: "bridge" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectBattery);
        expect(result?.actions).toContainEqual({
          type: "setRadioFlowPhase",
          phase: "remote",
        });
      });

      it("WebUsbFlashingTutorial back -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.WebUsbFlashingTutorial,
          { type: "back" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> FlashingInProgress with flash action", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectSuccess",
        });

        expect(result?.step).toBe(DataConnectionStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "flash" });
      });

      it("connectFailure with bad firmware -> BadFirmware", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorBadFirmware,
        });

        expect(result?.step).toBe(DataConnectionStep.BadFirmware);
      });

      it("connectFailure with no device selected -> TryAgainWebUsbSelectMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorNoDeviceSelected,
        });

        expect(result?.step).toBe(
          DataConnectionStep.TryAgainWebUsbSelectMicrobit
        );
      });

      it("connectFailure with unable to claim -> TryAgainCloseTabs", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.ErrorUnableToClaimInterface,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainCloseTabs);
      });

      it("connectFailure (other) -> TryAgainReplugMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "connectFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainReplugMicrobit);
      });

      it("flashSuccess in bridge phase -> ConnectingMicrobits with device id and connectMicrobits action", () => {
        const result = transition(
          flow,
          DataConnectionStep.FlashingInProgress,
          { type: "flashSuccess" },
          { radioFlowPhase: "bridge" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectingMicrobits);
        expect(result?.actions).toContainEqual({
          type: "setRadioBridgeDeviceId",
        });
        expect(result?.actions).toContainEqual({ type: "connectMicrobits" });
      });

      it("flashFailure with no device selected -> TryAgainWebUsbSelectMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.ErrorNoDeviceSelected,
        });

        expect(result?.step).toBe(
          DataConnectionStep.TryAgainWebUsbSelectMicrobit
        );
      });

      it("flashFailure with unable to claim -> TryAgainCloseTabs", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.ErrorUnableToClaimInterface,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainCloseTabs);
      });

      it("flashFailure (other) -> TryAgainReplugMicrobit", () => {
        const result = transition(flow, DataConnectionStep.FlashingInProgress, {
          type: "flashFailure",
          reason: ConnectResult.Failed,
        });

        expect(result?.step).toBe(DataConnectionStep.TryAgainReplugMicrobit);
      });
    });

    describe("connecting microbits outcomes", () => {
      it("deviceConnected -> Connected with notifyConnected", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectingMicrobits,
          { type: "deviceConnected" }
        );

        expect(result?.step).toBe(DataConnectionStep.Connected);
        expect(result?.actions).toContainEqual({ type: "notifyConnected" });
        expect(result?.actions).toContainEqual({
          type: "setConnected",
        });
      });

      it("deviceDisconnected on first attempt -> ConnectFailed", () => {
        const result = transition(
          flow,
          DataConnectionStep.ConnectingMicrobits,
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
      it("BadFirmware tryAgain -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.BadFirmware, {
          type: "tryAgain",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainReplugMicrobit tryAgain -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.TryAgainReplugMicrobit,
          { type: "tryAgain" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainCloseTabs tryAgain -> ConnectCable", () => {
        const result = transition(flow, DataConnectionStep.TryAgainCloseTabs, {
          type: "tryAgain",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("TryAgainWebUsbSelectMicrobit tryAgain -> ConnectCable", () => {
        const result = transition(
          flow,
          DataConnectionStep.TryAgainWebUsbSelectMicrobit,
          { type: "tryAgain" }
        );

        expect(result?.step).toBe(DataConnectionStep.ConnectCable);
      });

      it("ConnectFailed next -> ConnectingMicrobits with status and connectMicrobits", () => {
        const result = transition(flow, DataConnectionStep.ConnectFailed, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectingMicrobits);
        expect(result?.actions).toContainEqual({
          type: "setReconnecting",
          value: true,
        });
        expect(result?.actions).toContainEqual({ type: "connectMicrobits" });
      });

      it("ConnectionLost next -> ConnectingMicrobits with status and connectMicrobits", () => {
        const result = transition(flow, DataConnectionStep.ConnectionLost, {
          type: "next",
        });

        expect(result?.step).toBe(DataConnectionStep.ConnectingMicrobits);
        expect(result?.actions).toContainEqual({
          type: "setReconnecting",
          value: true,
        });
        expect(result?.actions).toContainEqual({ type: "connectMicrobits" });
      });
    });

    describe("close from any step", () => {
      const stepsWithClose = [
        DataConnectionStep.ConnectCable,
        DataConnectionStep.WebUsbFlashingTutorial,
        DataConnectionStep.BadFirmware,
        DataConnectionStep.TryAgainReplugMicrobit,
        DataConnectionStep.TryAgainCloseTabs,
        DataConnectionStep.TryAgainWebUsbSelectMicrobit,
        DataConnectionStep.ConnectFailed,
        DataConnectionStep.ConnectionLost,
      ];

      stepsWithClose.forEach((step) => {
        it(`${step} close -> None`, () => {
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DataConnectionStep.Idle);
        });
      });
    });
  });

  describe("radio flow phase transitions", () => {
    it("ConnectBattery next sets bridge phase", () => {
      // Go from remote phase ConnectBattery to bridge phase ConnectCable
      const forwardResult = transition(
        DataConnectionType.Radio,
        DataConnectionStep.ConnectBattery,
        { type: "next" },
        { radioFlowPhase: "remote" }
      );
      expect(forwardResult?.step).toBe(DataConnectionStep.ConnectCable);
      expect(forwardResult?.actions).toContainEqual({
        type: "setRadioFlowPhase",
        phase: "bridge",
      });
    });

    it("ConnectCable back in bridge phase sets remote phase", () => {
      // Go back from bridge phase ConnectCable to remote phase ConnectBattery
      const backResult = transition(
        DataConnectionType.Radio,
        DataConnectionStep.ConnectCable,
        { type: "back" },
        { radioFlowPhase: "bridge" }
      );
      expect(backResult?.step).toBe(DataConnectionStep.ConnectBattery);
      expect(backResult?.actions).toContainEqual({
        type: "setRadioFlowPhase",
        phase: "remote",
      });
    });
  });
});

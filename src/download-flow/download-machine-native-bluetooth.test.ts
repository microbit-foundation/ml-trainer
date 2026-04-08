/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DataConnectionType } from "../data-connection-flow";
import {
  DownloadEvent,
  DownloadFlowContext,
  downloadTransition,
} from "./download-machine";
import { DownloadStep, SameOrDifferentChoice } from "./download-types";

const testHex = { name: "test", hex: "test-hex-data" };

const createContext = (
  overrides: Partial<DownloadFlowContext> = {}
): DownloadFlowContext => ({
  hex: testHex,
  microbitChoice: SameOrDifferentChoice.Default,
  showPreDownloadHelp: true,
  hadSuccessfulConnection: false,
  dataConnectionType: DataConnectionType.NativeBluetooth,
  isUsbConnected: false,
  ...overrides,
});

const transition = (
  step: DownloadStep,
  event: DownloadEvent,
  context: Partial<DownloadFlowContext> = {}
) => {
  return downloadTransition(
    "nativeBluetooth",
    step,
    event,
    createContext(context)
  );
};

describe("Download flow: Native Bluetooth", () => {
  describe("start transitions", () => {
    it("shows help if showPreDownloadHelp is true", () => {
      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          showPreDownloadHelp: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.Help);
    });

    it("goes to NativeBluetoothPreConnectTutorial if help is skipped", () => {
      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          showPreDownloadHelp: false,
        }
      );

      expect(result?.step).toBe(DownloadStep.NativeBluetoothPreConnectTutorial);
      expect(result?.actions).toContainEqual({
        type: "disconnectDataConnection",
      });
    });
  });

  describe("forward navigation", () => {
    it("Help -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DownloadStep.Help, { type: "next" });

      expect(result?.step).toBe(DownloadStep.NativeBluetoothPreConnectTutorial);
      expect(result?.actions).toContainEqual({
        type: "disconnectDataConnection",
      });
    });

    it("NativeBluetoothPreConnectTutorial -> BluetoothPattern", () => {
      const result = transition(
        DownloadStep.NativeBluetoothPreConnectTutorial,
        { type: "next" }
      );

      expect(result?.step).toBe(DownloadStep.EnterBluetoothPattern);
    });

    it("BluetoothPattern -> FlashingInProgress", () => {
      const result = transition(DownloadStep.EnterBluetoothPattern, {
        type: "next",
      });

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({
        type: "connectFlash",
        clearDevice: true,
      });
    });
  });

  describe("back navigation coherence", () => {
    it("NativeBluetoothPreConnectTutorial back -> Help (help was shown)", () => {
      const result = transition(
        DownloadStep.NativeBluetoothPreConnectTutorial,
        { type: "back" },
        {
          showPreDownloadHelp: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.Help);
    });

    it("NativeBluetoothPreConnectTutorial back -> no transition (help was skipped)", () => {
      const result = transition(
        DownloadStep.NativeBluetoothPreConnectTutorial,
        { type: "back" },
        {
          showPreDownloadHelp: false,
        }
      );

      expect(result).toBeNull();
    });

    it("BluetoothPattern back -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DownloadStep.EnterBluetoothPattern, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.NativeBluetoothPreConnectTutorial);
    });
  });

  describe("flashing outcomes", () => {
    it("connectFlashSuccess -> flash", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "connectFlashSuccess",
        boardVersion: "V2",
      });

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "flash" });
    });

    it("flashSuccess -> None", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DownloadStep.None);
    });

    it("connectFlashFailure -> ConnectFailed", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "connectFlashFailure",
      });

      expect(result?.step).toBe(DownloadStep.ConnectFailed);
    });

    it("connectFlashFailure with no-device-selected -> ConnectFailed", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "connectFlashFailure",
        code: "no-device-selected",
      });

      expect(result?.step).toBe(DownloadStep.ConnectFailed);
    });

    it("flashFailure -> ConnectFailed", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "flashFailure",
      });

      expect(result?.step).toBe(DownloadStep.ConnectFailed);
    });
  });

  describe("ConnectFailed recovery", () => {
    it("tryAgain -> NativeBluetoothPreConnectTutorial", () => {
      const result = transition(DownloadStep.ConnectFailed, {
        type: "tryAgain",
      });

      expect(result?.step).toBe(DownloadStep.NativeBluetoothPreConnectTutorial);
    });
  });

  describe("close from any step", () => {
    const stepsWithClose = [
      DownloadStep.Help,
      DownloadStep.NativeBluetoothPreConnectTutorial,
      DownloadStep.EnterBluetoothPattern,
      DownloadStep.ConnectFailed,
    ];

    stepsWithClose.forEach((step) => {
      it(`${step} close -> None`, () => {
        const result = transition(step, { type: "close" });
        expect(result?.step).toBe(DownloadStep.None);
      });
    });
  });
});

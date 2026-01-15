/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
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
  dataConnectionType: DataConnectionType.WebBluetooth,
  isUsbConnected: false,
  ...overrides,
});

const transition = (
  step: DownloadStep,
  event: DownloadEvent,
  context: Partial<DownloadFlowContext> = {}
) => {
  return downloadTransition("webusb", step, event, createContext(context));
};

describe("Download flow: WebUSB", () => {
  describe("start transitions", () => {
    it("flashes immediately if there is an active USB connection", () => {
      const mockConnection = {
        status: DeviceConnectionStatus.CONNECTED,
      } as DownloadFlowContext["connection"];

      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          connection: mockConnection,
        }
      );

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "flash" });
    });

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

    it("shows choose microbit dialog if user has connected before", () => {
      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          showPreDownloadHelp: false,
          hadSuccessfulConnection: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.ChooseSameOrDifferentMicrobit);
    });

    it("goes directly to connect cable if no help and never connected", () => {
      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          showPreDownloadHelp: false,
          hadSuccessfulConnection: false,
        }
      );

      expect(result?.step).toBe(DownloadStep.ConnectCable);
    });
  });

  describe("forward navigation", () => {
    it("Help -> ChooseSameOrDifferentMicrobit (has connected before)", () => {
      const result = transition(DownloadStep.Help, { type: "next" }, {
        hadSuccessfulConnection: true,
      });

      expect(result?.step).toBe(DownloadStep.ChooseSameOrDifferentMicrobit);
    });

    it("Help -> ConnectCable (never connected)", () => {
      const result = transition(DownloadStep.Help, { type: "next" }, {
        hadSuccessfulConnection: false,
      });

      expect(result?.step).toBe(DownloadStep.ConnectCable);
    });

    it("ChooseSameOrDifferentMicrobit choseSame -> FlashingInProgress (USB connected, V2)", () => {
      const result = transition(
        DownloadStep.ChooseSameOrDifferentMicrobit,
        { type: "choseSame" },
        {
          isUsbConnected: true,
          connectedBoardVersion: "V2",
        }
      );

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({
        type: "setMicrobitChoice",
        choice: SameOrDifferentChoice.Same,
      });
      expect(result?.actions).toContainEqual({ type: "connect" });
    });

    it("ChooseSameOrDifferentMicrobit choseSame -> IncompatibleDevice (USB connected, V1)", () => {
      const result = transition(
        DownloadStep.ChooseSameOrDifferentMicrobit,
        { type: "choseSame" },
        {
          isUsbConnected: true,
          connectedBoardVersion: "V1",
        }
      );

      expect(result?.step).toBe(DownloadStep.IncompatibleDevice);
    });

    it("ChooseSameOrDifferentMicrobit choseSame -> ConnectCable (USB not connected)", () => {
      const result = transition(
        DownloadStep.ChooseSameOrDifferentMicrobit,
        { type: "choseSame" },
        {
          isUsbConnected: false,
        }
      );

      expect(result?.step).toBe(DownloadStep.ConnectCable);
    });

    it("ChooseSameOrDifferentMicrobit choseDifferent -> ConnectCable", () => {
      const result = transition(DownloadStep.ChooseSameOrDifferentMicrobit, {
        type: "choseDifferent",
      });

      expect(result?.step).toBe(DownloadStep.ConnectCable);
      expect(result?.actions).toContainEqual({
        type: "setMicrobitChoice",
        choice: SameOrDifferentChoice.Different,
      });
    });

    it("ConnectCable -> WebUsbFlashingTutorial", () => {
      const result = transition(DownloadStep.ConnectCable, { type: "next" });

      expect(result?.step).toBe(DownloadStep.WebUsbFlashingTutorial);
    });

    it("WebUsbFlashingTutorial -> FlashingInProgress", () => {
      const result = transition(DownloadStep.WebUsbFlashingTutorial, {
        type: "next",
      });

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "connect" });
    });
  });

  describe("back navigation coherence", () => {
    it("ConnectCable back -> ChooseSameOrDifferentMicrobit (has connected before)", () => {
      const result = transition(
        DownloadStep.ConnectCable,
        { type: "back" },
        {
          hadSuccessfulConnection: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.ChooseSameOrDifferentMicrobit);
    });

    it("ConnectCable back -> Help (never connected, help was shown)", () => {
      const result = transition(
        DownloadStep.ConnectCable,
        { type: "back" },
        {
          hadSuccessfulConnection: false,
          showPreDownloadHelp: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.Help);
    });

    it("ConnectCable back -> no transition (never connected, help was skipped)", () => {
      const result = transition(
        DownloadStep.ConnectCable,
        { type: "back" },
        {
          hadSuccessfulConnection: false,
          showPreDownloadHelp: false,
        }
      );

      expect(result).toBeNull();
    });

    it("ChooseSameOrDifferentMicrobit back -> Help", () => {
      const result = transition(DownloadStep.ChooseSameOrDifferentMicrobit, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.Help);
    });

    it("WebUsbFlashingTutorial back -> ConnectCable", () => {
      const result = transition(DownloadStep.WebUsbFlashingTutorial, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.ConnectCable);
    });

    it("IncompatibleDevice back -> ConnectCable", () => {
      const result = transition(DownloadStep.IncompatibleDevice, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.ConnectCable);
    });
  });

  describe("flashing outcomes", () => {
    it("connectSuccess -> flash (V2 board)", () => {
      const result = transition(
        DownloadStep.FlashingInProgress,
        { type: "connectSuccess", boardVersion: "V2" },
        {
          connectedBoardVersion: "V2",
        }
      );

      expect(result?.step).toBe(DownloadStep.FlashingInProgress);
      expect(result?.actions).toContainEqual({ type: "flash" });
    });

    it("connectSuccess -> IncompatibleDevice (V1 board)", () => {
      const result = transition(
        DownloadStep.FlashingInProgress,
        { type: "connectSuccess", boardVersion: "V1" },
        {
          connectedBoardVersion: "V1",
        }
      );

      expect(result?.step).toBe(DownloadStep.IncompatibleDevice);
    });

    it("connectFailure -> ManualFlashingTutorial", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "connectFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DownloadStep.ManualFlashingTutorial);
      expect(result?.actions).toContainEqual({ type: "downloadHexFile" });
    });

    it("flashSuccess -> None", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DownloadStep.None);
    });

    it("flashFailure -> ManualFlashingTutorial", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "flashFailure",
        code: "unknown-error",
      });

      expect(result?.step).toBe(DownloadStep.ManualFlashingTutorial);
      expect(result?.actions).toContainEqual({ type: "downloadHexFile" });
    });
  });

  describe("close from any step", () => {
    const stepsWithClose = [
      DownloadStep.Help,
      DownloadStep.ChooseSameOrDifferentMicrobit,
      DownloadStep.ConnectCable,
      DownloadStep.WebUsbFlashingTutorial,
      DownloadStep.ManualFlashingTutorial,
      DownloadStep.IncompatibleDevice,
    ];

    stepsWithClose.forEach((step) => {
      it(`${step} close -> None`, () => {
        const result = transition(step, { type: "close" });
        expect(result?.step).toBe(DownloadStep.None);
      });
    });
  });
});

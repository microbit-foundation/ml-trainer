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
  dataConnectionType: DataConnectionType.Radio,
  isUsbConnected: false,
  ...overrides,
});

const transition = (
  step: DownloadStep,
  event: DownloadEvent,
  context: Partial<DownloadFlowContext> = {}
) => {
  return downloadTransition("radio", step, event, createContext(context));
};

describe("Download flow: Radio", () => {
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

    it("goes to UnplugRadioBridgeMicrobit if help is skipped", () => {
      const result = transition(
        DownloadStep.None,
        { type: "start", hex: testHex },
        {
          showPreDownloadHelp: false,
        }
      );

      expect(result?.step).toBe(DownloadStep.UnplugRadioBridgeMicrobit);
      expect(result?.actions).toContainEqual({
        type: "disconnectDataConnection",
      });
    });
  });

  describe("forward navigation", () => {
    it("Help -> UnplugRadioBridgeMicrobit", () => {
      const result = transition(DownloadStep.Help, { type: "next" });

      expect(result?.step).toBe(DownloadStep.UnplugRadioBridgeMicrobit);
      expect(result?.actions).toContainEqual({
        type: "disconnectDataConnection",
      });
    });

    it("UnplugRadioBridgeMicrobit -> ConnectRadioRemoteMicrobit", () => {
      const result = transition(DownloadStep.UnplugRadioBridgeMicrobit, {
        type: "next",
      });

      expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
    });

    it("ConnectRadioRemoteMicrobit -> WebUsbFlashingTutorial", () => {
      const result = transition(DownloadStep.ConnectRadioRemoteMicrobit, {
        type: "next",
      });

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
    it("UnplugRadioBridgeMicrobit back -> Help (help was shown)", () => {
      const result = transition(
        DownloadStep.UnplugRadioBridgeMicrobit,
        { type: "back" },
        {
          showPreDownloadHelp: true,
        }
      );

      expect(result?.step).toBe(DownloadStep.Help);
    });

    it("UnplugRadioBridgeMicrobit back -> no transition (help was skipped)", () => {
      const result = transition(
        DownloadStep.UnplugRadioBridgeMicrobit,
        { type: "back" },
        {
          showPreDownloadHelp: false,
        }
      );

      expect(result).toBeNull();
    });

    it("ConnectRadioRemoteMicrobit back -> UnplugRadioBridgeMicrobit", () => {
      const result = transition(DownloadStep.ConnectRadioRemoteMicrobit, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.UnplugRadioBridgeMicrobit);
    });

    it("WebUsbFlashingTutorial back -> ConnectRadioRemoteMicrobit", () => {
      const result = transition(DownloadStep.WebUsbFlashingTutorial, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
    });

    it("IncompatibleDevice back -> ConnectRadioRemoteMicrobit", () => {
      const result = transition(DownloadStep.IncompatibleDevice, {
        type: "back",
      });

      expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
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

    it("flashSuccess -> None", () => {
      const result = transition(DownloadStep.FlashingInProgress, {
        type: "flashSuccess",
      });

      expect(result?.step).toBe(DownloadStep.None);
    });
  });

  describe("close from any step", () => {
    const stepsWithClose = [
      DownloadStep.Help,
      DownloadStep.UnplugRadioBridgeMicrobit,
      DownloadStep.ConnectRadioRemoteMicrobit,
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

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ConnectionStatus as DeviceConnectionStatus } from "@microbit/microbit-connection";
// DeviceErrorCode "reconnect-microbit" is used as a generic failure code
import { DataConnectionType } from "../data-connection-flow";
import {
  DownloadEvent,
  DownloadFlowContext,
  downloadTransition,
  DownloadFlowType,
} from "./download-machine";
import { DownloadStep, SameOrDifferentChoice } from "../model";

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
  flowType: DownloadFlowType,
  step: DownloadStep,
  event: DownloadEvent,
  context: Partial<DownloadFlowContext> = {}
) => {
  return downloadTransition(flowType, step, event, createContext(context));
};

describe("download-machine", () => {
  describe("webusbFlow", () => {
    const flow: DownloadFlowType = "webusb";

    describe("start transitions", () => {
      it("flashes immediately if there is an active USB connection", () => {
        const mockConnection = {
          status: DeviceConnectionStatus.CONNECTED,
        } as DownloadFlowContext["connection"];

        const result = transition(
          flow,
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
          flow,
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
          flow,
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
          flow,
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
        const result = transition(
          flow,
          DownloadStep.Help,
          { type: "next" },
          {
            hadSuccessfulConnection: true,
          }
        );

        expect(result?.step).toBe(DownloadStep.ChooseSameOrDifferentMicrobit);
      });

      it("Help -> ConnectCable (never connected)", () => {
        const result = transition(
          flow,
          DownloadStep.Help,
          { type: "next" },
          {
            hadSuccessfulConnection: false,
          }
        );

        expect(result?.step).toBe(DownloadStep.ConnectCable);
      });

      it("ChooseSameOrDifferentMicrobit choseSame -> FlashingInProgress (USB connected, V2)", () => {
        const result = transition(
          flow,
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
          flow,
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
          flow,
          DownloadStep.ChooseSameOrDifferentMicrobit,
          { type: "choseSame" },
          {
            isUsbConnected: false,
          }
        );

        expect(result?.step).toBe(DownloadStep.ConnectCable);
      });

      it("ChooseSameOrDifferentMicrobit choseDifferent -> ConnectCable", () => {
        const result = transition(
          flow,
          DownloadStep.ChooseSameOrDifferentMicrobit,
          { type: "choseDifferent" }
        );

        expect(result?.step).toBe(DownloadStep.ConnectCable);
        expect(result?.actions).toContainEqual({
          type: "setMicrobitChoice",
          choice: SameOrDifferentChoice.Different,
        });
      });

      it("ConnectCable -> WebUsbFlashingTutorial", () => {
        const result = transition(flow, DownloadStep.ConnectCable, {
          type: "next",
        });

        expect(result?.step).toBe(DownloadStep.WebUsbFlashingTutorial);
      });

      it("WebUsbFlashingTutorial -> FlashingInProgress", () => {
        const result = transition(flow, DownloadStep.WebUsbFlashingTutorial, {
          type: "next",
        });

        expect(result?.step).toBe(DownloadStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });
    });

    describe("back navigation coherence", () => {
      it("ConnectCable back -> ChooseSameOrDifferentMicrobit (has connected before)", () => {
        const result = transition(
          flow,
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
          flow,
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
          flow,
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
        const result = transition(
          flow,
          DownloadStep.ChooseSameOrDifferentMicrobit,
          { type: "back" }
        );

        expect(result?.step).toBe(DownloadStep.Help);
      });

      it("WebUsbFlashingTutorial back -> ConnectCable", () => {
        const result = transition(flow, DownloadStep.WebUsbFlashingTutorial, {
          type: "back",
        });

        expect(result?.step).toBe(DownloadStep.ConnectCable);
      });

      it("IncompatibleDevice back -> ConnectCable", () => {
        const result = transition(flow, DownloadStep.IncompatibleDevice, {
          type: "back",
        });

        expect(result?.step).toBe(DownloadStep.ConnectCable);
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> flash (V2 board)", () => {
        const result = transition(
          flow,
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
          flow,
          DownloadStep.FlashingInProgress,
          { type: "connectSuccess", boardVersion: "V1" },
          {
            connectedBoardVersion: "V1",
          }
        );

        expect(result?.step).toBe(DownloadStep.IncompatibleDevice);
      });

      it("connectFailure -> ManualFlashingTutorial", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
          type: "connectFailure",
          errorCode: "reconnect-microbit",
        });

        expect(result?.step).toBe(DownloadStep.ManualFlashingTutorial);
        expect(result?.actions).toContainEqual({ type: "downloadHexFile" });
      });

      it("flashSuccess -> None", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
          type: "flashSuccess",
        });

        expect(result?.step).toBe(DownloadStep.None);
      });

      it("flashFailure -> ManualFlashingTutorial", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
          type: "flashFailure",
          errorCode: "reconnect-microbit",
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
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DownloadStep.None);
        });
      });
    });
  });

  describe("nativeBluetoothFlow", () => {
    const flow: DownloadFlowType = "nativeBluetooth";

    describe("start transitions", () => {
      it("shows help if showPreDownloadHelp is true", () => {
        const result = transition(
          flow,
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
          flow,
          DownloadStep.None,
          { type: "start", hex: testHex },
          {
            showPreDownloadHelp: false,
          }
        );

        expect(result?.step).toBe(
          DownloadStep.NativeBluetoothPreConnectTutorial
        );
        expect(result?.actions).toContainEqual({
          type: "disconnectDataConnection",
        });
      });
    });

    describe("forward navigation", () => {
      it("Help -> NativeBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DownloadStep.Help, { type: "next" });

        expect(result?.step).toBe(
          DownloadStep.NativeBluetoothPreConnectTutorial
        );
        expect(result?.actions).toContainEqual({
          type: "disconnectDataConnection",
        });
      });

      it("NativeBluetoothPreConnectTutorial -> BluetoothPattern", () => {
        const result = transition(
          flow,
          DownloadStep.NativeBluetoothPreConnectTutorial,
          { type: "next" }
        );

        expect(result?.step).toBe(DownloadStep.BluetoothPattern);
      });

      it("BluetoothPattern -> FlashingInProgress", () => {
        const result = transition(flow, DownloadStep.BluetoothPattern, {
          type: "next",
        });

        expect(result?.step).toBe(DownloadStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });
    });

    describe("back navigation coherence", () => {
      it("NativeBluetoothPreConnectTutorial back -> Help (help was shown)", () => {
        const result = transition(
          flow,
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
          flow,
          DownloadStep.NativeBluetoothPreConnectTutorial,
          { type: "back" },
          {
            showPreDownloadHelp: false,
          }
        );

        expect(result).toBeNull();
      });

      it("BluetoothPattern back -> NativeBluetoothPreConnectTutorial", () => {
        const result = transition(flow, DownloadStep.BluetoothPattern, {
          type: "back",
        });

        expect(result?.step).toBe(
          DownloadStep.NativeBluetoothPreConnectTutorial
        );
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> flash", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
          type: "connectSuccess",
          boardVersion: "V2",
        });

        expect(result?.step).toBe(DownloadStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "flash" });
      });

      it("flashSuccess -> None", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
          type: "flashSuccess",
        });

        expect(result?.step).toBe(DownloadStep.None);
      });
    });

    describe("close from any step", () => {
      const stepsWithClose = [
        DownloadStep.Help,
        DownloadStep.NativeBluetoothPreConnectTutorial,
        DownloadStep.BluetoothPattern,
        DownloadStep.ManualFlashingTutorial,
      ];

      stepsWithClose.forEach((step) => {
        it(`${step} close -> None`, () => {
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DownloadStep.None);
        });
      });
    });
  });

  describe("radioFlow", () => {
    const flow: DownloadFlowType = "radio";

    describe("start transitions", () => {
      it("shows help if showPreDownloadHelp is true", () => {
        const result = transition(
          flow,
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
          flow,
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
        const result = transition(flow, DownloadStep.Help, { type: "next" });

        expect(result?.step).toBe(DownloadStep.UnplugRadioBridgeMicrobit);
        expect(result?.actions).toContainEqual({
          type: "disconnectDataConnection",
        });
      });

      it("UnplugRadioBridgeMicrobit -> ConnectRadioRemoteMicrobit", () => {
        const result = transition(
          flow,
          DownloadStep.UnplugRadioBridgeMicrobit,
          { type: "next" }
        );

        expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
      });

      it("ConnectRadioRemoteMicrobit -> WebUsbFlashingTutorial", () => {
        const result = transition(
          flow,
          DownloadStep.ConnectRadioRemoteMicrobit,
          { type: "next" }
        );

        expect(result?.step).toBe(DownloadStep.WebUsbFlashingTutorial);
      });

      it("WebUsbFlashingTutorial -> FlashingInProgress", () => {
        const result = transition(flow, DownloadStep.WebUsbFlashingTutorial, {
          type: "next",
        });

        expect(result?.step).toBe(DownloadStep.FlashingInProgress);
        expect(result?.actions).toContainEqual({ type: "connect" });
      });
    });

    describe("back navigation coherence", () => {
      it("UnplugRadioBridgeMicrobit back -> Help (help was shown)", () => {
        const result = transition(
          flow,
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
          flow,
          DownloadStep.UnplugRadioBridgeMicrobit,
          { type: "back" },
          {
            showPreDownloadHelp: false,
          }
        );

        expect(result).toBeNull();
      });

      it("ConnectRadioRemoteMicrobit back -> UnplugRadioBridgeMicrobit", () => {
        const result = transition(
          flow,
          DownloadStep.ConnectRadioRemoteMicrobit,
          { type: "back" }
        );

        expect(result?.step).toBe(DownloadStep.UnplugRadioBridgeMicrobit);
      });

      it("WebUsbFlashingTutorial back -> ConnectRadioRemoteMicrobit", () => {
        const result = transition(flow, DownloadStep.WebUsbFlashingTutorial, {
          type: "back",
        });

        expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
      });

      it("IncompatibleDevice back -> ConnectRadioRemoteMicrobit", () => {
        const result = transition(flow, DownloadStep.IncompatibleDevice, {
          type: "back",
        });

        expect(result?.step).toBe(DownloadStep.ConnectRadioRemoteMicrobit);
      });
    });

    describe("flashing outcomes", () => {
      it("connectSuccess -> flash (V2 board)", () => {
        const result = transition(
          flow,
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
          flow,
          DownloadStep.FlashingInProgress,
          { type: "connectSuccess", boardVersion: "V1" },
          {
            connectedBoardVersion: "V1",
          }
        );

        expect(result?.step).toBe(DownloadStep.IncompatibleDevice);
      });

      it("flashSuccess -> None", () => {
        const result = transition(flow, DownloadStep.FlashingInProgress, {
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
          const result = transition(flow, step, { type: "close" });
          expect(result?.step).toBe(DownloadStep.None);
        });
      });
    });
  });
});

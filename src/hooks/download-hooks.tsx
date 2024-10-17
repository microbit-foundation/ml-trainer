import {
  MicrobitWebUSBConnection,
  ConnectionStatus as UsbConnectionStatus,
} from "@microbit/microbit-connection";
import { useMemo } from "react";
import {
  ConnectActions,
  ConnectResult,
  ConnectionAndFlashOptions,
} from "../connect-actions";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { ConnectionStageActions } from "../connection-stage-actions";
import { ConnectionStage, useConnectionStage } from "../connection-stage-hooks";
import {
  DownloadState,
  DownloadStep,
  HexData,
  MicrobitToFlash,
} from "../model";
import { Settings } from "../settings";
import { useSettings, useStore } from "../store";
import { downloadHex } from "../utils/fs-util";

export class DownloadProjectActions {
  private flashingProgressCallback: (value: number) => void;
  constructor(
    private state: DownloadState,
    private setState: (stage: DownloadState) => void,
    private settings: Settings,
    private setSettings: (settings: Partial<Settings>) => void,
    private connectActions: ConnectActions,
    private connectionStage: ConnectionStage,
    private connectionStageActions: ConnectionStageActions,
    private connectionStatus: ConnectionStatus,
    flashingProgressCallback: (value: number) => void
  ) {
    this.flashingProgressCallback = (value: number) => {
      if (state.step !== DownloadStep.FlashingInProgress) {
        setState({ ...state, step: DownloadStep.FlashingInProgress });
      }
      flashingProgressCallback(value);
    };
  }

  clearMakeCodeUsbDevice = () => {
    this.setState({ ...this.state, usbDevice: undefined });
  };

  start = async (download: HexData) => {
    if (
      this.state.usbDevice &&
      this.state.usbDevice.status === UsbConnectionStatus.CONNECTED
    ) {
      const newState = {
        ...this.state,
        step: DownloadStep.FlashingInProgress,
        project: download,
      };
      this.setState(newState);
      await this.flashMicrobit(newState, {
        temporaryUsbConnection: this.state.usbDevice,
      });
    } else if (!this.settings.showPreDownloadHelp) {
      const newState = { ...this.state, hex: download };
      await this.onHelpNext(true, newState);
    } else {
      this.updateStage({
        step: DownloadStep.Help,
        microbitToFlash: MicrobitToFlash.Default,
        hex: download,
      });
    }
  };

  onHelpNext = async (isSkipNextTime: boolean, state?: DownloadState) => {
    this.setSettings({ showPreDownloadHelp: !isSkipNextTime });

    if (this.connectionStage.connType === "radio") {
      // Disconnect input micro:bit to not trigger radio connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.UnplugRadioBridgeMicrobit,
      });
    } else if (this.connectionStatus !== ConnectionStatus.NotConnected) {
      // If we've bluetooth connected to a micro:bit in the session,
      // we make the user choose a device even if the connection has been lost since.
      // This makes reconnect easier if the user has two micro:bits.
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.ChooseSameOrDifferentMicrobit,
        microbitToFlash: MicrobitToFlash.Default,
      });
    } else {
      this.updateStage({
        ...(state ?? {}),
        step: DownloadStep.ConnectCable,
      });
    }
  };

  onSkipIntro = (skipIntro: boolean) =>
    this.setSettings({ showPreDownloadHelp: !skipIntro });

  onBackToIntro = () => this.setStep(DownloadStep.Help);

  onChosenSameMicrobit = async () => {
    if (this.connectActions.isUsbDeviceConnected()) {
      const newStage = { ...this.state, microbitToFlash: MicrobitToFlash.Same };
      const usbConnection = this.connectActions.getUsbConnection();
      if (usbConnection.getBoardVersion() === "V1") {
        this.updateStage({
          ...newStage,
          step: DownloadStep.IncompatibleDevice,
        });
        return;
      }
      this.updateStage(newStage);
      // Can flash directly without choosing device.
      return this.connectAndFlashMicrobit(newStage);
    }
    this.updateStage({
      step: DownloadStep.ConnectCable,
      microbitToFlash: MicrobitToFlash.Same,
    });
  };

  onChosenDifferentMicrobit = () => {
    this.updateStage({
      step: DownloadStep.ConnectCable,
      microbitToFlash: MicrobitToFlash.Different,
    });
  };

  connectAndFlashMicrobit = async (stage: DownloadState) => {
    let connectionAndFlashOptions: ConnectionAndFlashOptions | undefined;
    if (
      stage.microbitToFlash === MicrobitToFlash.Same &&
      this.connectionStage.connType === "bluetooth"
    ) {
      // Disconnect input micro:bit to not trigger bluetooth connection lost warning.
      await this.connectionStageActions.disconnectInputMicrobit();
    }
    if (stage.microbitToFlash === MicrobitToFlash.Different) {
      // Use a temporary USB connection to flash the MakeCode program.
      // Disconnect the input micro:bit if the user selects this device from the
      // list by mistake.
      const temporaryUsbConnection = new MicrobitWebUSBConnection();
      const connectedDevice = this.connectActions.getUsbDevice();
      if (connectedDevice) {
        temporaryUsbConnection.setRequestDeviceExclusionFilters([
          { serialNumber: connectedDevice.serialNumber },
        ]);
      }
      connectionAndFlashOptions = {
        temporaryUsbConnection,
        callbackIfDeviceIsSame:
          this.connectionStageActions.disconnectInputMicrobit,
      };
    }
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }

    this.updateStage({ step: DownloadStep.WebUsbChooseMicrobit });

    const { result, usb } = await this.connectActions.requestUSBConnection(
      connectionAndFlashOptions
    );
    if (result === ConnectResult.Success && usb.getBoardVersion() === "V1") {
      return this.updateStage({
        step: DownloadStep.IncompatibleDevice,
      });
    }

    await this.flashMicrobit(stage, connectionAndFlashOptions);
  };

  private flashMicrobit = async (
    stage: DownloadState,
    connectionAndFlashOptions?: ConnectionAndFlashOptions
  ) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }
    const result = await this.connectActions.flashMicrobit(
      stage.hex.hex,
      this.flashingProgressCallback,
      connectionAndFlashOptions?.temporaryUsbConnection
    );
    const newStage = {
      usbDevice:
        connectionAndFlashOptions?.temporaryUsbConnection ??
        this.connectActions.getUsbConnection(),
      step:
        result === ConnectResult.Success
          ? DownloadStep.None
          : DownloadStep.ManualFlashingTutorial,
      flashProgress: 0,
    };
    this.updateStage(newStage);
    if (newStage.step === DownloadStep.ManualFlashingTutorial) {
      downloadHex(stage.hex);
    }
  };

  getOnNext = () => {
    const nextStep = this.getNextStep();
    return nextStep ? () => this.setStep(nextStep) : undefined;
  };

  getOnBack = () => {
    const prevStep = this.getPrevStep();
    return prevStep ? () => this.setStep(prevStep) : undefined;
  };

  private getNextStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.UnplugRadioBridgeMicrobit:
        return DownloadStep.ConnectRadioRemoteMicrobit;
      case DownloadStep.ConnectCable:
      case DownloadStep.ConnectRadioRemoteMicrobit:
        return DownloadStep.WebUsbFlashingTutorial;
      default:
        throw new Error(`Next step not accounted for: ${this.state.step}`);
    }
  };

  private getPrevStep = (): DownloadStep | undefined => {
    switch (this.state.step) {
      case DownloadStep.UnplugRadioBridgeMicrobit:
      case DownloadStep.ChooseSameOrDifferentMicrobit: {
        return this.settings.showPreDownloadHelp
          ? DownloadStep.Help
          : undefined;
      }
      case DownloadStep.ConnectRadioRemoteMicrobit:
        return DownloadStep.UnplugRadioBridgeMicrobit;
      case DownloadStep.ConnectCable: {
        if (this.state.microbitToFlash !== MicrobitToFlash.Default) {
          return DownloadStep.ChooseSameOrDifferentMicrobit;
        }
        if (this.settings.showPreDownloadHelp) {
          return DownloadStep.Help;
        }
        return undefined;
      }
      case DownloadStep.ManualFlashingTutorial:
      case DownloadStep.WebUsbFlashingTutorial: {
        return this.connectionStage.connType === "radio"
          ? DownloadStep.ConnectRadioRemoteMicrobit
          : DownloadStep.ConnectCable;
      }
      case DownloadStep.IncompatibleDevice:
        return DownloadStep.ChooseSameOrDifferentMicrobit;
      default:
        throw new Error(`Prev step not accounted for: ${this.state.step}`);
    }
  };

  close = () => this.setStep(DownloadStep.None);

  private updateStage = (partialStage: Partial<DownloadState>) => {
    this.setState({ ...this.state, ...partialStage } as DownloadState);
  };

  private setStep = (step: DownloadStep) =>
    this.setState({ ...this.state, step });
}

export const useDownloadActions = (): DownloadProjectActions => {
  const stage = useStore((s) => s.download);
  const setDownloadFlashingProgress = useStore(
    (s) => s.setDownloadFlashingProgress
  );
  const setStage = useStore((s) => s.setDownload);
  const [settings, setSettings] = useSettings();
  const connectActions = useConnectActions();
  const {
    actions: connectionStageActions,
    status: connectionStatus,
    stage: connectionStage,
  } = useConnectionStage();
  return useMemo(
    () =>
      new DownloadProjectActions(
        stage,
        setStage,
        settings,
        setSettings,
        connectActions,
        connectionStage,
        connectionStageActions,
        connectionStatus,
        setDownloadFlashingProgress
      ),
    [
      connectActions,
      connectionStage,
      connectionStageActions,
      connectionStatus,
      setDownloadFlashingProgress,
      setSettings,
      setStage,
      settings,
      stage,
    ]
  );
};

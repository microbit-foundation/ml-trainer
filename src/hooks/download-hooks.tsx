import {
  MicrobitWebUSBConnection,
  ConnectionStatus as UsbConnectionStatus,
} from "@microbit/microbit-connection";
import { useMemo } from "react";
import {
  ConnectActions,
  ConnectAndFlashResult,
  ConnectionAndFlashOptions,
} from "../connect-actions";
import { useConnectActions } from "../connect-actions-hooks";
import { ConnectionStatus } from "../connect-status-hooks";
import { ConnectionStageActions } from "../connection-stage-actions";
import { useConnectionStage } from "../connection-stage-hooks";
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
  constructor(
    private stage: DownloadState,
    private setStage: (stage: DownloadState) => void,
    private settings: Settings,
    private setSettings: (settings: Partial<Settings>) => void,
    private connectActions: ConnectActions,
    private connectionStageActions: ConnectionStageActions,
    private connectionStatus: ConnectionStatus
  ) {}

  clearMakeCodeUsbDevice = () => {
    this.setStage({ ...this.stage, usbDevice: undefined });
  };

  start = async (download: HexData) => {
    if (this.stage.usbDevice) {
      if (this.stage.usbDevice.status === UsbConnectionStatus.CONNECTED) {
        const newStage = {
          ...this.stage,
          step: DownloadStep.FlashingInProgress,
          project: download,
        };
        this.setStage(newStage);
        return this.flashMicrobit(newStage, {
          temporaryUsbConnection: this.stage.usbDevice,
        });
      }
      if (!this.settings.showPreDownloadHelp) {
        this.updateStage({ hex: download });
        return this.onHelpNext(true);
      }
      return this.updateStage({
        hex: download,
        step: DownloadStep.ConnectCable,
      });
    }
    this.updateStage({
      step: DownloadStep.Help,
      hex: download,
    });
  };

  onHelpNext = (isSkipNextTime: boolean) => {
    this.setSettings({ showPreDownloadHelp: !isSkipNextTime });

    // If we've connected to a micro:bit in the session, we make the user
    // choose a device even if the connection has been lost since.
    // This makes reconnect easier if the user has two micro:bits.
    if (this.connectionStatus !== ConnectionStatus.NotConnected) {
      return this.updateStage({
        step: DownloadStep.ChooseSameOrAnotherMicrobit,
      });
    }
    this.updateStage({
      step: DownloadStep.ConnectCable,
    });
  };

  onSkipIntro = (skipIntro: boolean) =>
    this.setSettings({ showPreDownloadHelp: !skipIntro });

  onBackToIntro = () => this.setStep(DownloadStep.Help);

  onChosenSameMicrobit = async () => {
    if (this.connectActions.isUsbDeviceConnected()) {
      const newStage = { ...this.stage, microbitToFlash: MicrobitToFlash.Same };
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
    if (stage.microbitToFlash === MicrobitToFlash.Same) {
      // Disconnect input micro:bit to not trigger connection lost warning.
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
    await this.flashMicrobit(stage, connectionAndFlashOptions);
  };

  flashMicrobit = async (
    stage: DownloadState,
    connectionAndFlashOptions?: ConnectionAndFlashOptions
  ) => {
    if (!stage.hex) {
      throw new Error("Project hex/name is not set!");
    }
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      stage.hex.hex,
      this.flashingProgressCallback,
      connectionAndFlashOptions
    );
    const newStage = {
      usbDevice:
        connectionAndFlashOptions?.temporaryUsbConnection ??
        this.connectActions.getUsbConnection(),
      step:
        result === ConnectAndFlashResult.Success
          ? DownloadStep.None
          : DownloadStep.ManualFlashingTutorial,
      flashProgress: 0,
    };
    this.updateStage(newStage);
    if (newStage.step === DownloadStep.ManualFlashingTutorial) {
      downloadHex(stage.hex);
    }
  };

  private flashingProgressCallback = (progress: number) => {
    this.setStage({
      ...this.stage,
      step: DownloadStep.FlashingInProgress,
      flashProgress: progress,
    });
  };

  close = () => this.setStep(DownloadStep.None);
  getOnNext = () => this.getOnNextIfPossible(1);
  getOnBack = () => this.getOnNextIfPossible(-1);

  private getOnNextIfPossible = (inc: number) =>
    this.getNextStep(inc)
      ? () => this.setStep(this.getNextStep(inc))
      : undefined;

  private getNextStep = (inc: number): DownloadStep => {
    const orderedSteps = this.downloadProjectStepOrder();
    const currIdx = orderedSteps.indexOf(this.stage.step);
    const nextIdx = currIdx + inc;
    if (currIdx < 0 || nextIdx < 0 || nextIdx === orderedSteps.length) {
      undefined;
    }
    return orderedSteps[nextIdx];
  };

  private downloadProjectStepOrder = () => [
    ...(this.settings.showPreDownloadHelp ? [DownloadStep.Help] : []),
    ...(this.stage.step === DownloadStep.ChooseSameOrAnotherMicrobit ||
    this.stage.microbitToFlash !== MicrobitToFlash.Default
      ? [DownloadStep.ChooseSameOrAnotherMicrobit]
      : []),
    DownloadStep.ConnectCable,
    this.stage.step === DownloadStep.ManualFlashingTutorial
      ? DownloadStep.ManualFlashingTutorial
      : DownloadStep.WebUsbFlashingTutorial,
  ];

  private updateStage = (partialStage: Partial<DownloadState>) => {
    this.setStage({ ...this.stage, ...partialStage } as DownloadState);
  };

  private setStep = (step: DownloadStep) =>
    this.setStage({ ...this.stage, step });
}

export const useDownloadActions = (): DownloadProjectActions => {
  const stage = useStore((s) => s.download);
  const setStage = useStore((s) => s.setDownload);
  const [settings, setSettings] = useSettings();
  const connectActions = useConnectActions();
  const { actions: connectionStageActions, status: connectionStatus } =
    useConnectionStage();
  return useMemo(
    () =>
      new DownloadProjectActions(
        stage,
        setStage,
        settings,
        setSettings,
        connectActions,
        connectionStageActions,
        connectionStatus
      ),
    [
      connectActions,
      connectionStageActions,
      connectionStatus,
      setSettings,
      setStage,
      settings,
      stage,
    ]
  );
};

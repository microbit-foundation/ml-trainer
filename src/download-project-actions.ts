import {
  MicrobitWebUSBConnection,
  ConnectionStatus as UsbConnectionStatus,
} from "@microbit/microbit-connection";
import {
  ConnectActions,
  ConnectAndFlashResult,
  ConnectionAndFlashOptions,
} from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import { ConnectionStageActions } from "./connection-stage-actions";
import {
  DownloadProjectStage,
  DownloadProjectStep,
  MicrobitToFlash,
} from "./download-project-hooks";

export class DownloadProjectActions {
  constructor(
    private stage: DownloadProjectStage,
    private setStage: (stage: DownloadProjectStage) => void,
    private connectActions: ConnectActions,
    private connectionStageActions: ConnectionStageActions,
    private setFlashingProgress: (progress: number) => void,
    private connectionStatus: ConnectionStatus
  ) {}

  clearMakeCodeUsbDevice = () => {
    this.setStage({ ...this.stage, usbDevice: undefined });
  };

  start = async (download: { name: string; hex: string }) => {
    if (this.stage.usbDevice) {
      if (this.stage.usbDevice.status === UsbConnectionStatus.CONNECTED) {
        const newStage: DownloadProjectStage = {
          ...this.stage,
          step: DownloadProjectStep.FlashingInProgress,
          projectHex: download.hex,
          projectName: download.name,
        };
        this.setStage(newStage);
        return this.flashMicrobit(newStage, {
          temporaryUsbConnection: this.stage.usbDevice,
        });
      }
      return this.updateStage({
        projectHex: download.hex,
        projectName: download.name,
        step: DownloadProjectStep.ConnectCable,
      });
    }
    const projectInfo = {
      projectHex: download.hex,
      projectName: download.name,
    };
    if (this.stage.skipIntro) {
      return this.onIntroNext(projectInfo);
    }
    this.updateStage({
      step: DownloadProjectStep.Introduction,
      ...projectInfo,
    });
  };

  onIntroNext = async (partialNewStage: Partial<DownloadProjectStage> = {}) => {
    if (this.connectionStatus === ConnectionStatus.Connected) {
      return this.updateStage({
        ...partialNewStage,
        step: DownloadProjectStep.ChooseSameOrAnotherMicrobit,
      });
    }
    // TODO: Is the right behaviour?
    // Maybe the user should choose a device if they have previously
    // connected to one, even if it isn't connected right now.
    const deviceId = this.connectActions.getUsbDeviceId();
    if (deviceId) {
      const newStage = { ...this.stage, ...partialNewStage };
      // Can flash directly without choosing device.
      return await this.connectAndFlashMicrobit(newStage);
    }
    this.updateStage({
      ...partialNewStage,
      step: DownloadProjectStep.ConnectCable,
    });
  };

  onSkipIntro = (skipIntro: boolean) => this.updateStage({ skipIntro });

  onBackToIntro = () => this.setStep(DownloadProjectStep.Introduction);

  onChosenSameMicrobit = async () => {
    if (this.connectActions.isUsbDeviceConnected()) {
      const newStage = { ...this.stage, microbitToFlash: MicrobitToFlash.Same };
      // Can flash directly without choosing device.
      return this.connectAndFlashMicrobit(newStage);
    }
    this.updateStage({
      step: DownloadProjectStep.ConnectCable,
      microbitToFlash: MicrobitToFlash.Same,
    });
  };

  onChosenDifferentMicrobit = () => {
    this.updateStage({
      step: DownloadProjectStep.ConnectCable,
      microbitToFlash: MicrobitToFlash.Different,
    });
  };

  connectAndFlashMicrobit = async (stage: DownloadProjectStage) => {
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
      connectionAndFlashOptions = {
        temporaryUsbConnection,
        callbackIfDeviceIsSame:
          this.connectionStageActions.disconnectInputMicrobit,
      };
    }
    if (!stage.projectHex || !stage.projectName) {
      throw new Error("Project hex/name is not set!");
    }
    this.updateStage({ step: DownloadProjectStep.WebUsbChooseMicrobit });
    await this.flashMicrobit(stage, connectionAndFlashOptions);
  };

  flashMicrobit = async (
    stage: DownloadProjectStage,
    connectionAndFlashOptions?: ConnectionAndFlashOptions
  ) => {
    if (!stage.projectHex || !stage.projectName) {
      throw new Error("Project hex/name is not set!");
    }
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      stage.projectHex,
      this.flashingProgressCallback,
      connectionAndFlashOptions
    );
    this.updateStage({
      usbDevice:
        connectionAndFlashOptions?.temporaryUsbConnection ??
        this.connectActions.getUsbDevice(),
      step:
        result === ConnectAndFlashResult.Success
          ? DownloadProjectStep.None
          : DownloadProjectStep.ManualFlashingTutorial,
    });
    this.setFlashingProgress(0);
  };

  private flashingProgressCallback = (progress: number) => {
    if (this.stage.step !== DownloadProjectStep.FlashingInProgress) {
      this.setStep(DownloadProjectStep.FlashingInProgress);
    }
    this.setFlashingProgress(progress);
  };

  close = () => this.setStep(DownloadProjectStep.None);
  getOnNext = () => this.getOnNextIfPossible(1);
  getOnBack = () => this.getOnNextIfPossible(-1);

  private getOnNextIfPossible = (inc: number) =>
    this.getNextStep(inc)
      ? () => this.setStep(this.getNextStep(inc))
      : undefined;

  private getNextStep = (inc: number): DownloadProjectStep => {
    const orderedSteps = this.downloadProjectStepOrder();
    const currIdx = orderedSteps.indexOf(this.stage.step);
    const nextIdx = currIdx + inc;
    if (currIdx < 0 || nextIdx < 0 || nextIdx === orderedSteps.length) {
      undefined;
    }
    return orderedSteps[nextIdx];
  };

  private downloadProjectStepOrder = () => [
    ...(this.stage.skipIntro ? [] : [DownloadProjectStep.Introduction]),
    ...(this.stage.step === DownloadProjectStep.ChooseSameOrAnotherMicrobit ||
    this.stage.microbitToFlash !== MicrobitToFlash.Default
      ? [DownloadProjectStep.ChooseSameOrAnotherMicrobit]
      : []),
    DownloadProjectStep.ConnectCable,
    this.stage.step === DownloadProjectStep.ManualFlashingTutorial
      ? DownloadProjectStep.ManualFlashingTutorial
      : DownloadProjectStep.WebUsbFlashingTutorial,
  ];

  private updateStage = (partialStage: Partial<DownloadProjectStage>) => {
    this.setStage({ ...this.stage, ...partialStage } as DownloadProjectStage);
  };

  private setStep = (step: DownloadProjectStep) =>
    this.setStage({ ...this.stage, step });
}

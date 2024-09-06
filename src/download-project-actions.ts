import { ConnectActions, ConnectAndFlashResult } from "./connect-actions";
import { ConnectionStatus } from "./connect-status-hooks";
import { ConnectionStageActions } from "./connection-stage-actions";
import {
  DownloadProjectStage,
  DownloadProjectStep,
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

  start = (download: { name: string; hex: string }) => {
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
    const deviceId = this.connectActions.getUsbDeviceId();
    if (deviceId) {
      const newStage = { ...this.stage, ...partialNewStage };
      // Can flash directly without choosing device.
      return await this.connectAndFlashMicrobit(newStage);
    }
    this.updateStage({
      ...partialNewStage,
      step: DownloadProjectStep.ChooseSameOrAnotherMicrobit,
    });
  };

  onSkipIntro = (skipIntro: boolean) => this.updateStage({ skipIntro });

  onBackToIntro = () => this.setStep(DownloadProjectStep.Introduction);

  onChosenSameMicrobit = async () => {
    // Disconnect input micro:bit to not trigger connection lost warning.
    await this.connectionStageActions.disconnectInputMicrobit();
    this.setStep(DownloadProjectStep.ConnectCable);
  };

  onChosenDifferentMicrobit = async () => {
    // Forget usb device so that user can select a different usb device.
    await this.connectActions.clearUsbDevice();
    this.setStep(DownloadProjectStep.ConnectCable);
  };

  connectAndFlashMicrobit = async (stage: DownloadProjectStage) => {
    if (!stage.projectHex || !stage.projectName) {
      throw new Error("Project hex/name is not set!");
    }
    this.setStage({ ...stage, step: DownloadProjectStep.WebUsbChooseMicrobit });
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      stage.projectHex,
      this.flashingProgressCallback
    );
    this.setStage({
      ...stage,
      step:
        result === ConnectAndFlashResult.Success
          ? DownloadProjectStep.None
          : DownloadProjectStep.ManualFlashingTutorial,
    });
  };

  private flashingProgressCallback = (progress: number) => {
    if (this.stage.step !== DownloadProjectStep.FlashingInProgress) {
      this.setStep(DownloadProjectStep.FlashingInProgress);
    }
    this.setFlashingProgress(progress);
  };

  close = () => this.setStep(DownloadProjectStep.None);
  next = () => this.setStep(this.getNextStep(1));
  back = () => this.setStep(this.getNextStep(-1));

  private getNextStep = (inc: number): DownloadProjectStep => {
    const orderedSteps = this.downloadProjectStepOrder(this.stage.step);
    const currIdx = orderedSteps.indexOf(this.stage.step);
    const nextIdx = currIdx + inc;
    if (currIdx < 0 || nextIdx < 0 || nextIdx === orderedSteps.length) {
      throw new Error("Impossible step");
    }
    return orderedSteps[nextIdx];
  };

  private downloadProjectStepOrder = (currStep: DownloadProjectStep) => [
    DownloadProjectStep.ConnectCable,
    currStep === DownloadProjectStep.ManualFlashingTutorial
      ? DownloadProjectStep.ManualFlashingTutorial
      : DownloadProjectStep.WebUsbFlashingTutorial,
  ];

  private updateStage = (partialStage: Partial<DownloadProjectStage>) => {
    this.setStage({ ...this.stage, ...partialStage } as DownloadProjectStage);
  };

  private setStep = (step: DownloadProjectStep) =>
    this.setStage({ ...this.stage, step });
}

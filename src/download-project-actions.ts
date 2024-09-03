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
    this.setStage({
      step: DownloadProjectStep.Introduction,
      projectHex: download.hex,
      projectName: download.name,
    });
  };

  onIntroductionNext = () => {
    this.setStep(
      this.connectionStatus === ConnectionStatus.Connected
        ? DownloadProjectStep.ChooseSameOrAnotherMicrobit
        : DownloadProjectStep.ConnectCable
    );
  };

  onChosenSameMicrobit = async () => {
    await this.connectionStageActions.disconnectInputMicrobit();
    this.setStep(DownloadProjectStep.ConnectCable);
  };

  onChosenDifferentMicrobit = () => {
    this.setStep(DownloadProjectStep.ConnectCable);
  };

  connectAndFlashMicrobit = async () => {
    this.setStep(DownloadProjectStep.WebUsbChooseMicrobit);
    if (!this.stage.projectHex) {
      throw new Error("Project hex not set!");
    }
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      this.stage.projectHex,
      this.flashingProgressCallback
    );
    this.setStep(
      result === ConnectAndFlashResult.Success
        ? DownloadProjectStep.None
        : DownloadProjectStep.ManualFlashingTutorial
    );
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
    DownloadProjectStep.Introduction,
    DownloadProjectStep.ChooseSameOrAnotherMicrobit,
    DownloadProjectStep.ConnectCable,
    currStep === DownloadProjectStep.ManualFlashingTutorial
      ? DownloadProjectStep.ManualFlashingTutorial
      : DownloadProjectStep.WebUsbFlashingTutorial,
  ];

  private setStep = (step: DownloadProjectStep) =>
    this.setStage({ ...this.stage, step });
}

import { ConnectActions, ConnectAndFlashResult } from "./connect-actions";
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
    private progressCallback: (progress: number) => void
  ) {}

  start = async (download: { name: string; hex: string }) => {
    // TODO: Only disconnect input micro:bit if user chooses this device.
    await this.connectionStageActions.disconnectInputMicrobit();
    this.setStage({
      step: DownloadProjectStep.ConnectCable,
      projectHex: download.hex,
      projectName: download.name,
    });
  };

  connectAndFlashMicrobit = async () => {
    this.setStep(DownloadProjectStep.WebUsbChooseMicrobit);
    if (!this.stage.projectHex) {
      throw new Error("Project hex not set!");
    }
    const { result } = await this.connectActions.requestUSBConnectionAndFlash(
      this.stage.projectHex,
      this.progressCallback
    );
    this.setStep(
      result === ConnectAndFlashResult.Success
        ? DownloadProjectStep.None
        : DownloadProjectStep.ManualFlashingTutorial
    );
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

  private setStep = (step: DownloadProjectStep) =>
    this.setStage({ ...this.stage, step });
}

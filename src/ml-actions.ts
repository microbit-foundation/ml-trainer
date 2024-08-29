import { Gesture } from "./hooks/use-gestures";
import { Logging } from "./logging/logging";
import { TrainingResult, trainModel } from "./ml";
import { MlStage, MlStatus } from "./hooks/use-ml-status";
import { LayersModel } from "@tensorflow/tfjs";

export class MlActions {
  constructor(
    private logger: Logging,
    private gestures: Gesture[],
    private setStatus: (status: MlStatus) => void,
    private updateProject: (gestures: Gesture[], model: LayersModel) => void
  ) {}

  trainModel = async (): Promise<TrainingResult> => {
    this.setStatus({ stage: MlStage.TrainingInProgress, progressValue: 0 });
    const detail = {
      numActions: this.gestures.length,
      numRecordings: this.gestures.reduce(
        (acc, d) => d.recordings.length + acc,
        0
      ),
    };

    const trainingResult = await trainModel({
      data: this.gestures,
      onProgress: (progressValue) =>
        this.setStatus({ stage: MlStage.TrainingInProgress, progressValue }),
    });

    if (trainingResult.error) {
      this.logger.event({
        type: "Data",
        message: "Training error",
        detail,
      });
      this.setStatus({ stage: MlStage.TrainingError });
    } else {
      this.logger.event({
        type: "Data",
        message: "Train model",
        detail,
      });
      this.setStatus({
        stage: MlStage.TrainingComplete,
        model: trainingResult.model,
      });
      this.updateProject(this.gestures, trainingResult.model);
    }

    return trainingResult;
  };
}

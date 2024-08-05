import { GestureContextState } from "./gestures-hooks";
import { Logging } from "./logging/logging";
import { TrainingResult, trainModel } from "./ml";
import { MlStage, MlStatus } from "./ml-status-hooks";

export class MlActions {
  constructor(
    private logger: Logging,
    private gestureState: GestureContextState,
    private setStatus: (status: MlStatus) => void
  ) {}

  trainModel = async (): Promise<TrainingResult> => {
    this.setStatus({ stage: MlStage.TrainingInProgress, progressValue: 0 });
    const { data } = this.gestureState;
    const detail = {
      numActions: data.length,
      numRecordings: data.reduce((acc, d) => d.recordings.length + acc, 0),
    };
    const trainingResult = await trainModel({
      data,
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
    }

    return trainingResult;
  };
}

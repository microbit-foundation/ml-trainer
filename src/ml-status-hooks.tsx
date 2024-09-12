import { LayersModel } from "@tensorflow/tfjs";

export enum MlStage {
  InsufficientData = "InsufficientData",
  NotTrained = "NotTrained",
  TrainingInProgress = "TrainingInProgress",
  TrainingComplete = "TrainingComplete",
  TrainingError = "TrainingError",
}

export interface TrainingCompleteMlStatus {
  stage: MlStage.TrainingComplete;
  model: LayersModel;
}

export type MlStatus =
  | {
      stage: MlStage.TrainingInProgress;
      progressValue: number;
    }
  | TrainingCompleteMlStatus
  | {
      stage: Exclude<
        MlStage,
        MlStage.TrainingInProgress | MlStage.TrainingComplete
      >;
    };

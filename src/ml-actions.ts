import { LayersModel } from "@tensorflow/tfjs";
import {
  ConfidentGestureData,
  GestureContextState,
  GestureData,
} from "./gestures-hooks";
import gestureData from "./test-fixtures/gesture-data.json";
import { Logging } from "./logging/logging";
import { Confidences, mlSettings, predict, trainModel } from "./ml";
import { MlStage, MlStatus } from "./ml-status-hooks";

const defaultRequiredConfidence = 0.8;

export class MlActions {
  private predictionInterval: NodeJS.Timeout | undefined;
  private model: LayersModel | undefined;
  constructor(
    private logger: Logging,
    private keepTesting: boolean,
    private gestureState: GestureContextState,
    private setGestureState: (gestureData: GestureContextState) => void,
    private status: MlStatus,
    private setStatus: (status: MlStatus) => void
  ) {}

  trainModel = async () => {
    this.setStatus({ stage: MlStage.TrainingInProgress, progressValue: 0 });
    const { data } = this.gestureState;
    const model = await trainModel({
      data,
      onTraining: (progressValue) =>
        this.setStatus({ stage: MlStage.TrainingInProgress, progressValue }),
      onTrainEnd: () => this.setStatus({ stage: MlStage.TrainingComplete }),
      onError: () => this.setStatus({ stage: MlStage.TrainingError }),
    });

    if (!model) {
      // Errors in training a model are handled in train model function
      return;
    }

    this.model = model;
    this.logger.event({
      type: "Data",
      message: "Train model",
      detail: {
        numActions: data.length,
        numRecordings: data.reduce((acc, d) => d.recordings.length + acc, 0),
      },
    });
    this.predictionInterval = setInterval(
      this.testModel,
      1000 / mlSettings.updatesPrSecond
    );
  };

  private testModel = async () => {
    if (this.checkIfInterrupted() && this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }

    if (this.keepTesting) {
      const confidences = await predict({
        model: this.model as LayersModel,
        // TODO: Get data from accelerometer instead of using dummy data
        data: gestureData[1].recordings[0].data,
        classificationIds: this.gestureState.data.map((d) => d.ID),
      });
      if (!confidences) {
        // Error is handled in predict function
        return;
      }
      this.updateGestureDataConfidences(confidences);
    }
  };

  private checkIfInterrupted = () =>
    this.status.stage !== MlStage.TrainingComplete;

  private updateGestureDataConfidences = (confidences: Confidences) => {
    const updatedGestureData = this.gestureState.data.map(
      (gesture): GestureData => {
        return {
          ...gesture,
          confidence: {
            requiredConfidence:
              gesture.confidence?.requiredConfidence ??
              defaultRequiredConfidence,
            currentConfidence: confidences[gesture.ID] ?? undefined,
          },
        };
      }
    );
    this.setGestureState({ data: updatedGestureData });
  };

  getPredicted = () => {
    const confidentGestures = this.gestureState.data.filter((g) => {
      return (
        g.confidence !== undefined &&
        g.confidence.currentConfidence !== undefined &&
        g.confidence.currentConfidence > g.confidence.requiredConfidence
      );
    }) as ConfidentGestureData[];
    if (confidentGestures.length === 0) {
      return undefined;
    }
    return confidentGestures.reduce((prevPredictedGesture, gesture) => {
      return prevPredictedGesture.confidence.currentConfidence <
        gesture.confidence.currentConfidence
        ? gesture
        : prevPredictedGesture;
    });
  };

  updateGestureRequiredConfidence = (
    gestureId: GestureData["ID"],
    requiredConfidence: number
  ) => {
    this.setGestureState({
      ...this.setGestureState,
      data: this.gestureState.data.map((gesture) => {
        return gesture.ID === gestureId
          ? {
              ...gesture,
              confidence: { ...(gesture.confidence || {}), requiredConfidence },
            }
          : gesture;
      }),
    });
  };
}

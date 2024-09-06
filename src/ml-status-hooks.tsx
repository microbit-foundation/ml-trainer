import * as tf from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { hasSufficientDataForTraining, useGestureData } from "./gestures-hooks";

export enum MlStage {
  RecordingData = "RecordingData",
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

type MlStatusContextValue = [MlStatus, (status: MlStatus) => void];

const MlStatusContext = createContext<MlStatusContextValue | undefined>(
  undefined
);

export const useMlStatus = () => {
  const mlState = useContext(MlStatusContext);
  if (!mlState) {
    throw new Error("Missing provider");
  }
  return mlState;
};

export const modelUrl = "indexeddb://micro:bit-ml-tool-model";

export const MlStatusProvider = ({ children }: { children: ReactNode }) => {
  const [gestureState] = useGestureData();
  const [mlState, setMlState] = useState<MlStatus>({
    stage: hasSufficientDataForTraining(gestureState.data)
      ? MlStage.NotTrained
      : MlStage.InsufficientData,
  });

  const setStatus = useCallback((s: MlStatus) => {
    setMlState((prevState) => ({ ...prevState }));
    if (s.stage === MlStage.TrainingComplete) {
      s.model.save(modelUrl).catch(() => {
        // IndexedDB not available?
      });
    } else {
      tf.io.removeModel(modelUrl).catch(() => {
        // Throws if there is no model to remove.
      });
    }
    setMlState(s);
  }, []);

  useEffect(() => {
    tf.loadLayersModel(modelUrl)
      .then((model) => {
        setMlState({
          stage: MlStage.TrainingComplete,
          model,
        });
      })
      .catch(() => {
        // Throws if there is no model to load.
      });
  }, []);

  return (
    <MlStatusContext.Provider value={[mlState, setStatus]}>
      {children}
    </MlStatusContext.Provider>
  );
};

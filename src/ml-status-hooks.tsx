import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { hasSufficientDataForTraining, useGestureData } from "./gestures-hooks";
import { LayersModel } from "@tensorflow/tfjs";

export enum MlStage {
  RecordingData,
  InsufficientData,
  NotTrained,
  TrainingInProgress,
  TrainingComplete,
  TrainingError,
  RetrainingNeeded,
}

export type MlStatus =
  | {
      stage: MlStage.TrainingInProgress;
      progressValue: number;
    }
  | {
      stage: MlStage.TrainingComplete;
      model: LayersModel;
    }
  | {
      stage: MlStage.RetrainingNeeded;
    }
  | {
      stage: Exclude<
        MlStage,
        | MlStage.TrainingInProgress
        | MlStage.TrainingComplete
        | MlStage.RetrainingNeeded
      >;
    };

interface MlStatusState {
  status: MlStatus;
  hasTrainedBefore: boolean;
}

type MlStatusContextValue = [MlStatusState, (status: MlStatusState) => void];

const MlStatusContext = createContext<MlStatusContextValue | undefined>(
  undefined
);

export const MlStatusProvider = ({ children }: { children: ReactNode }) => {
  const [gestureState] = useGestureData();
  const statusContextValue = useState<MlStatusState>({
    status: {
      stage: hasSufficientDataForTraining(gestureState.data)
        ? MlStage.NotTrained
        : MlStage.InsufficientData,
    },
    hasTrainedBefore: false,
  });
  return (
    <MlStatusContext.Provider value={statusContextValue}>
      {children}
    </MlStatusContext.Provider>
  );
};

export const useMlStatus = (): [MlStatus, (status: MlStatus) => void] => {
  const statusContextValue = useContext(MlStatusContext);
  if (!statusContextValue) {
    throw new Error("Missing provider");
  }
  const [state, setState] = statusContextValue;

  const setStatus = useCallback(
    (s: MlStatus) => {
      const hasTrainedBefore =
        s.stage === MlStage.TrainingComplete || state.hasTrainedBefore;

      // Update to retrain instead of not trained if has trained before
      const status =
        hasTrainedBefore && s.stage === MlStage.NotTrained
          ? ({ stage: MlStage.RetrainingNeeded } as const)
          : s;

      setState({ ...state, status, hasTrainedBefore });
    },
    [setState, state]
  );

  return [state.status, setStatus];
};

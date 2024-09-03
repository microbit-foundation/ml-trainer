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
  RecordingData = "RecordingData",
  InsufficientData = "InsufficientData",
  NotTrained = "NotTrained",
  TrainingInProgress = "TrainingInProgress",
  TrainingComplete = "TrainingComplete",
  TrainingError = "TrainingError",
  RetrainingNeeded = "RetrainingNeeded",
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

export enum TrainModelDialogStage {
  Closed = "closed",
  ShowingIntroduction = "showing introduction",
  ShowingTrainingStatus = "showing training status",
}

interface MlStatusState {
  mlStatus: MlStatus;
  hasTrainedBefore: boolean;
  trainModelDialog: TrainModelDialogStage;
  skipTrainModelIntro: boolean;
}

type MlStatusContextValue = [MlStatusState, (status: MlStatusState) => void];

const MlStatusContext = createContext<MlStatusContextValue | undefined>(
  undefined
);

export const MlStatusProvider = ({ children }: { children: ReactNode }) => {
  const [gestureState] = useGestureData();
  const statusContextValue = useState<MlStatusState>({
    mlStatus: {
      stage: hasSufficientDataForTraining(gestureState.data)
        ? MlStage.NotTrained
        : MlStage.InsufficientData,
    },
    skipTrainModelIntro: false,
    trainModelDialog: TrainModelDialogStage.Closed,
    hasTrainedBefore: false,
  });
  return (
    <MlStatusContext.Provider value={statusContextValue}>
      {children}
    </MlStatusContext.Provider>
  );
};

const useStatusContextValue = (): MlStatusContextValue => {
  const statusContextValue = useContext(MlStatusContext);
  if (!statusContextValue) {
    throw new Error("Missing provider");
  }
  return statusContextValue;
};

export const useMlStatus = (): [MlStatus, (status: MlStatus) => void] => {
  const [state, setState] = useStatusContextValue();
  const setStatus = useCallback(
    (s: MlStatus) => {
      const hasTrainedBefore =
        s.stage === MlStage.TrainingComplete || state.hasTrainedBefore;

      // Update to retrain instead of not trained if has trained before
      const status =
        hasTrainedBefore && s.stage === MlStage.NotTrained
          ? ({ stage: MlStage.RetrainingNeeded } as const)
          : s;

      setState({ ...state, mlStatus: status, hasTrainedBefore });
    },
    [setState, state]
  );

  return [state.mlStatus, setStatus];
};

export const useTrainModelDialogs = () => {
  const [state, setState] = useStatusContextValue();

  const onClose = useCallback(() => {
    setState({ ...state, trainModelDialog: TrainModelDialogStage.Closed });
  }, [setState, state]);

  const onOpen = useCallback(() => {
    setState({
      ...state,
      trainModelDialog: state.skipTrainModelIntro
        ? TrainModelDialogStage.ShowingTrainingStatus
        : TrainModelDialogStage.ShowingIntroduction,
    });
  }, [setState, state]);

  const onIntroNext = useCallback(
    (isSkipIntro: boolean) => {
      setState({
        ...state,
        skipTrainModelIntro: isSkipIntro,
        trainModelDialog: TrainModelDialogStage.ShowingTrainingStatus,
      });
    },
    [setState, state]
  );

  return {
    stage: state.trainModelDialog,
    isSkipIntro: state.skipTrainModelIntro,
    onIntroNext,
    onClose,
    onOpen,
  };
};

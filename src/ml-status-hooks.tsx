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

interface MlStatusState {
  status: MlStatus;
  isTrainModelDialogOpen: boolean;
  skipTrainModelIntro: boolean;
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
    skipTrainModelIntro: false,
    isTrainModelDialogOpen: false,
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

      setState({ ...state, status, hasTrainedBefore });
    },
    [setState, state]
  );

  return [state.status, setStatus];
};

export const useTrainModelDialogs = () => {
  const [state, setState] = useStatusContextValue();

  const onClose = useCallback(() => {
    setState({ ...state, isTrainModelDialogOpen: false });
  }, [setState, state]);

  const onOpen = useCallback(() => {
    setState({ ...state, isTrainModelDialogOpen: true });
  }, [setState, state]);

  const setSkipIntro = useCallback(
    (skipTrainModelIntro: boolean) => {
      setState({ ...state, skipTrainModelIntro });
    },
    [setState, state]
  );

  return {
    isOpen: state.isTrainModelDialogOpen,
    onClose,
    onOpen,
    setSkipIntro,
    isSkipIntro: state.skipTrainModelIntro,
  };
};

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { hasSufficientDataForTraining, useGestureData } from "./gestures-hooks";

export enum Stage {
  RecordingData,
  InsufficientData,
  NotTrained,
  TrainingInProgress,
  TrainingComplete,
  TrainingError,
  RetrainingNeeded,
}

export type Status =
  | {
      stage: Stage.TrainingInProgress;
      progressValue: number;
    }
  | {
      stage: Exclude<Stage, Stage.TrainingInProgress>;
    };

interface StatusState {
  status: Status;
  hasTrainedBefore: boolean;
}

type StatusContextValue = [StatusState, (status: StatusState) => void];

const StatusContext = createContext<StatusContextValue | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const [gestureState] = useGestureData();
  const statusContextValue = useState<StatusState>({
    status: {
      stage: hasSufficientDataForTraining(gestureState.data)
        ? Stage.NotTrained
        : Stage.InsufficientData,
    },
    hasTrainedBefore: false,
  });
  return (
    <StatusContext.Provider value={statusContextValue}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = (): [Status, (status: Status) => void] => {
  const statusContextValue = useContext(StatusContext);
  if (!statusContextValue) {
    throw new Error("Missing provider");
  }
  const [state, setState] = statusContextValue;

  const setStatus = useCallback(
    (s: Status) => {
      const hasTrainedBefore =
        s.stage === Stage.TrainingComplete || state.hasTrainedBefore;

      // Update to retrain instead of not trained if has trained before
      const status =
        hasTrainedBefore && s.stage === Stage.NotTrained
          ? ({ stage: Stage.RetrainingNeeded } as const)
          : s;

      setState({ ...state, status, hasTrainedBefore });
    },
    [setState, state]
  );

  return [state.status, setStatus];
};

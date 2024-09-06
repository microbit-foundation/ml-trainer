import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export enum TrainModelDialogStage {
  Closed = "closed",
  ShowingIntroduction = "showing introduction",
  ShowingTrainingStatus = "showing training status",
}

interface TrainModelDialogState {
  stage: TrainModelDialogStage;
  skipIntro: boolean;
}

type TrainModelDialogStateContextValue = [
  TrainModelDialogState,
  (state: TrainModelDialogState) => void
];

const TrainModelDialogStateContext = createContext<
  TrainModelDialogStateContextValue | undefined
>(undefined);

export const TrainModelDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<TrainModelDialogState>({
    stage: TrainModelDialogStage.Closed,
    skipIntro: false,
  });

  return (
    <TrainModelDialogStateContext.Provider value={[state, setState]}>
      {children}
    </TrainModelDialogStateContext.Provider>
  );
};

export const useTrainModelDialog = () => {
  const dialogContextValue = useContext(TrainModelDialogStateContext);
  if (!dialogContextValue) {
    throw new Error("Missing provider");
  }
  const [state, setState] = dialogContextValue;

  const onClose = useCallback(() => {
    setState({ ...state, stage: TrainModelDialogStage.Closed });
  }, [setState, state]);

  const onOpen = useCallback(() => {
    setState({
      ...state,
      stage: state.skipIntro
        ? TrainModelDialogStage.ShowingTrainingStatus
        : TrainModelDialogStage.ShowingIntroduction,
    });
  }, [setState, state]);

  const onIntroNext = useCallback(
    (isSkipIntro: boolean) => {
      setState({
        ...state,
        skipIntro: isSkipIntro,
        stage: TrainModelDialogStage.ShowingTrainingStatus,
      });
    },
    [setState, state]
  );

  return {
    stage: state.stage,
    isSkipIntro: state.skipIntro,
    onIntroNext,
    onClose,
    onOpen,
  };
};

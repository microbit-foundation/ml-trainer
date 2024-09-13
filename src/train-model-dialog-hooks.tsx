import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { MlStage } from "./ml-status-hooks";
import { SessionPageId } from "./pages-config";
import { useAppStore } from "./store";
import { createSessionPageUrl } from "./urls";

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
  const trainModel = useAppStore((s) => s.trainModel);
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

  const navigate = useNavigate();

  const onIntroNext = useCallback(
    async (isSkipIntro: boolean) => {
      setState({
        ...state,
        skipIntro: isSkipIntro,
        stage: TrainModelDialogStage.ShowingTrainingStatus,
      });
      const result = await trainModel();
      if (result.stage === MlStage.TrainingComplete) {
        setState({
          ...state,
          stage: TrainModelDialogStage.Closed,
        });
        navigate(createSessionPageUrl(SessionPageId.TestingModel));
      }
    },
    [navigate, setState, state, trainModel]
  );

  return {
    stage: state.stage,
    isSkipIntro: state.skipIntro,
    onIntroNext,
    onClose,
    onOpen,
  };
};

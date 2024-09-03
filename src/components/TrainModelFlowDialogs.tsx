import {
  TrainModelDialogStage,
  useTrainModelDialogs,
} from "../ml-status-hooks";
import TrainModelIntroDialog from "./TrainModelIntroDialog";
import TrainingStatusDialog from "./TrainingStatusDialog";

const TrainModelFlowDialogs = () => {
  const { stage, onIntroNext, onClose } = useTrainModelDialogs();

  switch (stage) {
    case TrainModelDialogStage.Closed:
      return <></>;
    case TrainModelDialogStage.ShowingIntroduction:
      return <TrainModelIntroDialog onNext={onIntroNext} />;
    case TrainModelDialogStage.ShowingTrainingStatus:
      return <TrainingStatusDialog onClose={onClose} />;
  }
};

export default TrainModelFlowDialogs;

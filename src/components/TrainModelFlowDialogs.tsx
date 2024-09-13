import {
  TrainModelDialogStage,
  useTrainModelDialog,
} from "../hooks/train-model-dialog-hooks";
import TrainModelIntroDialog from "./TrainModelIntroDialog";
import TrainingStatusDialog from "./TrainingStatusDialog";

const TrainModelFlowDialogs = () => {
  const { stage, onIntroNext, onClose } = useTrainModelDialog();

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

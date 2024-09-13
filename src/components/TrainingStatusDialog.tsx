import { MlStage } from "../model";
import { useAppStore } from "../store";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";

interface TrainingStatusDialogProps {
  onClose: () => void;
}

const TrainingStatusDialog = ({ onClose }: TrainingStatusDialogProps) => {
  const status = useAppStore((s) => s.mlStatus);

  switch (status.stage) {
    case MlStage.TrainingError:
      return <TrainingErrorDialog isOpen={true} onClose={onClose} />;
    case MlStage.TrainingInProgress:
      return (
        <TrainingModelProgressDialog
          isOpen={true}
          progress={status.progressValue * 100}
        />
      );
    default:
      return <TrainingModelProgressDialog isOpen={true} progress={0} />;
  }
};

export default TrainingStatusDialog;

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { MlStage } from "../ml-status-hooks";
import { createSessionPageUrl } from "../urls";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";
import { SessionPageId } from "../pages-config";
import { useAppStore } from "../store";

interface TrainingStatusDialogProps {
  onClose: () => void;
}

const TrainingStatusDialog = ({ onClose }: TrainingStatusDialogProps) => {
  const status = useAppStore((s) => s.mlStatus);
  const trainModel = useAppStore((s) => s.trainModel);
  const navigate = useNavigate();

  // TODO: What is this doing triggering training?
  // Let's remove this!
  useEffect(() => {
    if (status.stage === MlStage.NotTrained) {
      void trainModel();
    }
    if (status.stage === MlStage.TrainingComplete) {
      onClose();
      navigate(createSessionPageUrl(SessionPageId.TestingModel));
    }
  }, [navigate, onClose, status.stage, trainModel]);

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

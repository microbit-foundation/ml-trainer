import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMlActions } from "../ml-hooks";
import { MlStage, useMlStatus } from "../ml-status-hooks";
import { createStepPageUrl } from "../urls";
import InsufficientDataDialog from "./InsufficientDataDialog";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";
import { TabId } from "../pages-config";

interface TrainingStatusDialogProps {
  onClose: () => void;
}

const TrainingStatusDialog = ({ onClose }: TrainingStatusDialogProps) => {
  const [status] = useMlStatus();
  const actions = useMlActions();
  const navigate = useNavigate();

  const handleTrain = useCallback(async () => {
    await actions.trainModel();
  }, [actions]);

  useEffect(() => {
    if (
      status.stage === MlStage.NotTrained ||
      status.stage === MlStage.RetrainingNeeded
    ) {
      void handleTrain();
    }
    if (status.stage === MlStage.TrainingComplete) {
      onClose();
      navigate(createStepPageUrl(TabId.Model));
    }
  }, [handleTrain, navigate, onClose, status.stage]);

  switch (status.stage) {
    case MlStage.InsufficientData:
      return <InsufficientDataDialog onClose={onClose} />;
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

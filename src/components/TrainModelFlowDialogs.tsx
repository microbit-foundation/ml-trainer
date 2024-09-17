import { useCallback } from "react";
import { useNavigate } from "react-router";
import { TrainModelDialogStage } from "../model";
import { SessionPageId } from "../pages-config";
import { useStore, useSettings } from "../store";
import { createSessionPageUrl } from "../urls";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";
import TrainModelIntroDialog from "./TrainModelHelpDialog";
import TrainModelInsufficientDataDialog from "./TrainModelInsufficientDataDialog";

const TrainModelDialogs = () => {
  const stage = useStore((s) => s.trainModelDialogStage);
  const closeTrainModelDialogs = useStore((s) => s.closeTrainModelDialogs);
  const navigate = useNavigate();
  const trainModel = useStore((s) => s.trainModel);
  const trainModelProgress = useStore((s) => s.trainModelProgress);
  const [, setSettings] = useSettings();

  const handleHelpNext = useCallback(
    async (isSkipNextTime: boolean) => {
      setSettings({ showPreTrainHelp: !isSkipNextTime });
      const result = await trainModel();
      if (result) {
        navigate(createSessionPageUrl(SessionPageId.TestingModel));
      }
    },
    [navigate, setSettings, trainModel]
  );
  return (
    <>
      <TrainModelInsufficientDataDialog
        isOpen={stage === TrainModelDialogStage.InsufficientData}
        onClose={closeTrainModelDialogs}
      />
      <TrainModelIntroDialog
        isOpen={stage === TrainModelDialogStage.Help}
        onNext={handleHelpNext}
        onClose={closeTrainModelDialogs}
      />
      <TrainingErrorDialog
        isOpen={stage === TrainModelDialogStage.TrainingError}
        onClose={closeTrainModelDialogs}
      />
      <TrainingModelProgressDialog
        isOpen={stage === TrainModelDialogStage.TrainingInProgress}
        progress={trainModelProgress * 100}
      />
    </>
  );
};

export default TrainModelDialogs;

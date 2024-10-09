import { useCallback } from "react";
import { useNavigate } from "react-router";
import { TourId, TrainModelDialogStage } from "../model";
import { SessionPageId } from "../pages-config";
import { useStore, useSettings } from "../store";
import { createSessionPageUrl } from "../urls";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";
import TrainModelIntroDialog from "./TrainModelHelpDialog";
import TrainModelInsufficientDataDialog from "./TrainModelInsufficientDataDialog";

interface TrainModelDialogsProps {
  finalFocusRef?: React.RefObject<HTMLButtonElement>;
}

const TrainModelDialogs = ({ finalFocusRef }: TrainModelDialogsProps) => {
  const stage = useStore((s) => s.trainModelDialogStage);
  const closeTrainModelDialogs = useStore((s) => s.closeTrainModelDialogs);
  const tourStart = useStore((s) => s.tourStart);
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
        tourStart(TourId.TestModelPage);
      }
    },
    [navigate, tourStart, setSettings, trainModel]
  );
  return (
    <>
      <TrainModelInsufficientDataDialog
        isOpen={stage === TrainModelDialogStage.InsufficientData}
        onClose={closeTrainModelDialogs}
        finalFocusRef={finalFocusRef}
      />
      <TrainModelIntroDialog
        isOpen={stage === TrainModelDialogStage.Help}
        onNext={handleHelpNext}
        onClose={closeTrainModelDialogs}
        finalFocusRef={finalFocusRef}
      />
      <TrainingErrorDialog
        isOpen={stage === TrainModelDialogStage.TrainingError}
        onClose={closeTrainModelDialogs}
        finalFocusRef={finalFocusRef}
      />
      <TrainingModelProgressDialog
        isOpen={stage === TrainModelDialogStage.TrainingInProgress}
        progress={trainModelProgress * 100}
        finalFocusRef={finalFocusRef}
      />
    </>
  );
};

export default TrainModelDialogs;

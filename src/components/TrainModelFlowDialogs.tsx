import { useCallback } from "react";
import { useNavigate } from "react-router";
import { TrainModelDialogStage } from "../model";
import { SessionPageId } from "../pages-config";
import { useStore, useSettings } from "../store";
import { createSessionPageUrl } from "../urls";
import TrainingErrorDialog from "./TrainingErrorDialog";
import TrainingModelProgressDialog from "./TrainingModelProgressDialog";
import TrainModelIntroDialog from "./TrainModelIntroDialog";

const TrainModelFlowDialogs = () => {
  const stage = useStore((s) => s.trainModelDialogStage);
  const closeTrainModelDialogs = useStore((s) => s.closeTrainModelDialogs);
  const navigate = useNavigate();
  const trainModel = useStore((s) => s.trainModel);
  const trainModelProgress = useStore((s) => s.trainModelProgress);
  const [, setSettings] = useSettings();

  const handleIntroNext = useCallback(
    async (isSkipNextTime: boolean) => {
      setSettings({ showPreTrainHelp: !isSkipNextTime });
      const result = await trainModel();
      if (result) {
        navigate(createSessionPageUrl(SessionPageId.TestingModel));
      }
    },
    [navigate, setSettings, trainModel]
  );

  switch (stage) {
    case TrainModelDialogStage.Closed:
      return null;
    case TrainModelDialogStage.ShowingIntroduction:
      return (
        <TrainModelIntroDialog
          onNext={handleIntroNext}
          onClose={closeTrainModelDialogs}
        />
      );
    case TrainModelDialogStage.TrainingError:
      return (
        <TrainingErrorDialog isOpen={true} onClose={closeTrainModelDialogs} />
      );
    case TrainModelDialogStage.TrainingInProgress:
      return (
        <TrainingModelProgressDialog
          isOpen={true}
          progress={trainModelProgress * 100}
        />
      );
  }
};

export default TrainModelFlowDialogs;

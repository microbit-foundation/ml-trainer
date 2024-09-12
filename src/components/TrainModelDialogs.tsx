import { useCallback, useState } from "react";
import TrainModelIntroDialog from "./TrainModelIntroDialog";
import TrainingStatusDialog from "./TrainingStatusDialog";
import { useStorage } from "../hooks/use-storage";

enum TrainingStage {
  INSUFFICIENT_DATA,
  INTRO,
  TRAINING_STATUS,
}

interface TrainingSettings {
  skipIntro: boolean;
}

interface TrainModelDialogsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrainModelDialogs = ({ isOpen, onClose }: TrainModelDialogsProps) => {
  const [trainingSettings, setTrainingSettings] = useStorage<TrainingSettings>(
    "session",
    "trainingSettings",
    { skipIntro: false }
  );
  const [trainingStage, setTrainingStage] = useState<TrainingStage>(
    TrainingStage.INTRO
  );

  const handleNext = useCallback(
    (skipIntro: boolean) => {
      if (skipIntro) {
        setTrainingSettings({
          skipIntro: true,
        });
      }
      setTrainingStage(TrainingStage.TRAINING_STATUS);
    },
    [setTrainingSettings]
  );

  if (!isOpen) {
    return;
  }
  switch (trainingStage) {
    case TrainingStage.INTRO:
      if (trainingSettings.skipIntro) {
        setTrainingStage(TrainingStage.TRAINING_STATUS);
      }
      return <TrainModelIntroDialog onClose={onClose} onNext={handleNext} />;
    case TrainingStage.INSUFFICIENT_DATA:
      return <TrainingStatusDialog onClose={onClose} />;
    case TrainingStage.TRAINING_STATUS:
      return <TrainingStatusDialog onClose={onClose} />;
  }
};

export default TrainModelDialogs;

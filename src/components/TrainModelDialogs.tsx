import { useCallback, useEffect, useState } from "react";
import TrainModelIntroDialog from "./TrainModelIntroDialog";
import TrainingStatusDialog from "./TrainingStatusDialog";
import { useStorage } from "../hooks/use-storage";
import InsufficientDataDialog from "./InsufficientDataDialog";

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
  hasSufficientData: boolean;
}

const TrainModelDialogs = ({
  isOpen,
  onClose,
  hasSufficientData,
}: TrainModelDialogsProps) => {
  const [trainingSettings, setTrainingSettings] = useStorage<TrainingSettings>(
    "session",
    "trainingSettings",
    { skipIntro: false }
  );
  const [trainingStage, setTrainingStage] = useState<TrainingStage>(
    hasSufficientData ? TrainingStage.INTRO : TrainingStage.INSUFFICIENT_DATA
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

  useEffect(() => {
    if (hasSufficientData) {
      setTrainingStage(TrainingStage.INTRO);
    } else {
      setTrainingStage(TrainingStage.INSUFFICIENT_DATA);
    }
  }, [hasSufficientData]);

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
      return <InsufficientDataDialog onClose={onClose} />;
    case TrainingStage.TRAINING_STATUS:
      return <TrainingStatusDialog onClose={onClose} />;
  }
};

export default TrainModelDialogs;

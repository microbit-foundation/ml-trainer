import { useCallback, useEffect, useState } from "react";
import { useTrainModelDialogs } from "../ml-status-hooks";
import TrainModelIntroDialog from "./TrainModelDialog";
import TrainingStatusDialog from "./TrainingStatusView";

type TrainModelDialogStage = "none" | "intro" | "training initiated";

const TrainModelFlowDialogs = () => {
  const { isOpen, isSkipIntro, setSkipIntro, onClose } = useTrainModelDialogs();
  const [stage, setStage] = useState<TrainModelDialogStage>(
    !isOpen ? "none" : isSkipIntro ? "training initiated" : "intro"
  );

  useEffect(() => {
    setStage(!isOpen ? "none" : isSkipIntro ? "training initiated" : "intro");
  }, [isOpen, isSkipIntro]);

  const onTrain = useCallback(
    (isSkipIntro: boolean) => {
      setSkipIntro(isSkipIntro);
      setStage("training initiated");
    },
    [setSkipIntro]
  );

  switch (stage) {
    case "none":
      return <></>;
    case "intro":
      return <TrainModelIntroDialog onNext={onTrain} />;
    case "training initiated":
      return <TrainingStatusDialog onClose={onClose} />;
  }
};

export default TrainModelFlowDialogs;

import { Button, ButtonProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { MlStage } from "../ml-status-hooks";
import { useAppStore } from "../store";

const TrainingButton = (props: ButtonProps) => {
  const { stage } = useAppStore((s) => s.mlStatus);

  return (
    <Button
      variant="primary"
      isDisabled={
        stage === MlStage.TrainingInProgress ||
        stage === MlStage.InsufficientData
      }
      {...props}
    >
      <FormattedMessage id="menu.trainer.trainModelButton" />
    </Button>
  );
};

export default TrainingButton;

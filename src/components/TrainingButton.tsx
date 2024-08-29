import { Button, ButtonProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { MlStage, useMlStatus } from "../hooks/use-ml-status";

const TrainingButton = (props: ButtonProps) => {
  const [{ stage }] = useMlStatus();

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

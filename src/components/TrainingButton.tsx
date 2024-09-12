import { Button, ButtonProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { MlStage, useMlStatus } from "../ml-status-hooks";

interface TrainingButtonProps extends ButtonProps {
  textId?: string;
}

const TrainingButton = ({ textId, ...rest }: TrainingButtonProps) => {
  const [{ stage }] = useMlStatus();

  return (
    <Button
      variant={
        stage === MlStage.InsufficientData ? "secondary-disabled" : "primary"
      }
      isDisabled={stage === MlStage.TrainingInProgress}
      {...rest}
    >
      <FormattedMessage id={textId ?? "menu.trainer.trainModelButton"} />
    </Button>
  );
};

export default TrainingButton;

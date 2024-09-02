import { Button, ButtonProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { MlStage, useMlStatus } from "../ml-status-hooks";

const TrainingButton = (props: ButtonProps) => {
  const [{ stage }] = useMlStatus();

  return (
    <Button
      variant="primary"
      isDisabled={stage === MlStage.TrainingComplete}
      {...props}
    >
      <FormattedMessage id="menu.trainer.trainModelButton" />
    </Button>
  );
};

export default TrainingButton;

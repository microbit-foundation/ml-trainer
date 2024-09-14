import { Button, ButtonProps } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useAppStore, useHasSufficientDataForTraining } from "../store";

const TrainingButton = (props: ButtonProps) => {
  const hasSufficientData = useHasSufficientDataForTraining();
  const model = useAppStore((s) => s.model);
  const isEnabled = hasSufficientData && !model;
  return (
    <Button variant="primary" isDisabled={!isEnabled} {...props}>
      <FormattedMessage id="menu.trainer.trainModelButton" />
    </Button>
  );
};

export default TrainingButton;

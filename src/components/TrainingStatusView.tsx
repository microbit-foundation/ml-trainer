import {
  Button,
  HStack,
  Heading,
  Progress,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import { useMlActions } from "../ml-actions";
import { TrainingStatus, useTrainingStatus } from "../training-status-hook";
import { createStepPageUrl } from "../urls";
import TrainingButton from "./TrainingButton";
import TrainingErrorDialog from "./TrainingErrorDialog";

const TrainingStatusView = () => {
  const navigate = useNavigate();
  const [trainingStatus] = useTrainingStatus();
  const actions = useMlActions();
  const [trainProgress, setTrainProgress] = useState<number>(0);
  const trainErrorDialog = useDisclosure();

  const navigateToDataPage = useCallback(() => {
    navigate(createStepPageUrl("add-data"));
  }, [navigate]);

  const navigateToTestModelPage = useCallback(() => {
    navigate(createStepPageUrl("test-model"));
  }, [navigate]);

  const handleTrain = useCallback(async () => {
    await actions.trainModel((progress) => setTrainProgress(progress));
  }, [actions]);

  useEffect(() => {
    if (trainingStatus === TrainingStatus.Error) {
      trainErrorDialog.onOpen();
    }
  }, [trainErrorDialog, trainingStatus]);

  switch (trainingStatus) {
    case TrainingStatus.InsufficientData:
      return (
        <TrainingStatusSection statusId="menu.trainer.notEnoughDataHeader1">
          <Text>
            <FormattedMessage id="menu.trainer.notEnoughDataInfoBody" />
          </Text>
          <Button variant="primary" onClick={navigateToDataPage}>
            <FormattedMessage id="menu.trainer.addDataButton" />
          </Button>
        </TrainingStatusSection>
      );
    case TrainingStatus.Error:
    case TrainingStatus.NotTrained:
      return (
        <>
          <TrainingErrorDialog
            isOpen={trainErrorDialog.isOpen}
            onClose={trainErrorDialog.onClose}
          />
          <TrainingStatusSection statusId="content.trainer.enoughdata.title">
            <TrainingButton onClick={handleTrain} />
          </TrainingStatusSection>
        </>
      );
    case TrainingStatus.InProgress:
      return (
        <TrainingStatusSection statusId="content.trainer.training.title">
          <Progress
            colorScheme="green"
            value={trainProgress * 100}
            w="350px"
            rounded="full"
          />
        </TrainingStatusSection>
      );
    case TrainingStatus.Complete:
      return (
        <TrainingStatusSection statusId="menu.trainer.TrainingFinished">
          <HStack gap={10}>
            <Button variant="secondary" onClick={navigateToDataPage}>
              <FormattedMessage id="menu.trainer.addMoreDataButton" />
            </Button>
            <Button variant="primary" onClick={navigateToTestModelPage}>
              <FormattedMessage id="menu.trainer.testModelButton" />
            </Button>
          </HStack>
        </TrainingStatusSection>
      );
    case TrainingStatus.Retrain:
      return (
        <TrainingStatusSection statusId="content.trainer.retrain.title">
          <TrainingButton onClick={handleTrain} />
        </TrainingStatusSection>
      );
  }
};

interface TrainingStatusSectionProps {
  statusId: string;
  children: ReactNode;
}

const TrainingStatusSection = ({
  statusId,
  children,
}: TrainingStatusSectionProps) => {
  return (
    <VStack gap={10}>
      <Heading as="h2" fontSize="lg" fontWeight="semibold">
        <FormattedMessage id={statusId} />
      </Heading>
      {children}
    </VStack>
  );
};

export default TrainingStatusView;

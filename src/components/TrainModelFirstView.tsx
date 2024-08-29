import { Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import testModelImage from "../images/test_model_black.svg";
import { StepId } from "../pages-config";
import { createStepPageUrl } from "../urls";
import TrainingButton from "./TrainingButton";
import { MlStage, useMlStatus } from "../hooks/use-ml-status";

interface TrainModelFirstViewConfig {
  textIds: string[];
  navigateToStep: StepId;
}

const getConfig = (status: MlStage): TrainModelFirstViewConfig => {
  switch (status) {
    case MlStage.InsufficientData:
      return {
        textIds: [
          "content.model.notEnoughDataInfoBody1",
          "content.model.notEnoughDataInfoBody2",
        ],
        navigateToStep: "add-data",
      };
    case MlStage.RetrainingNeeded:
      return {
        textIds: ["content.model.retrainModelBody"],
        navigateToStep: "train-model",
      };
    default:
      return {
        textIds: ["content.model.trainModelBody"],
        navigateToStep: "train-model",
      };
  }
};

const TrainModelFirstView = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();

  const navigateToDataPage = useCallback(() => {
    navigate(createStepPageUrl("add-data"));
  }, [navigate]);

  const navigateToTrainModelPage = useCallback(() => {
    navigate(createStepPageUrl("train-model"));
  }, [navigate]);

  const config = getConfig(stage);
  return (
    <VStack flexGrow={1} alignItems="center" gap={10} bgColor="gray.25">
      <VStack gap={0}>
        <Image
          src={testModelImage}
          opacity={0.4}
          pt={10}
          w="350px"
          h="249px"
          alt=""
        />
        <VStack gap={5}>
          <Heading as="h1" fontSize="2xl" fontWeight="bold">
            <FormattedMessage id="content.model.trainModelFirstHeading" />
          </Heading>
          {config.textIds.map((textId, idx) => (
            <Text key={idx} maxW="450px" textAlign="center">
              <FormattedMessage id={textId} />
            </Text>
          ))}
        </VStack>
      </VStack>
      {config.navigateToStep === "add-data" ? (
        <Button variant="primary" onClick={navigateToDataPage}>
          <FormattedMessage id="content.model.addData" />
        </Button>
      ) : (
        <TrainingButton onClick={navigateToTrainModelPage} />
      )}
    </VStack>
  );
};

export default TrainModelFirstView;

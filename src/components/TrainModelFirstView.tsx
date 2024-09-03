import { Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import testModelImage from "../images/test_model_black.svg";
import { TabId } from "../pages-config";
import { MlStage, useMlStatus, useTrainModelDialogs } from "../ml-status-hooks";
import { createStepPageUrl } from "../urls";
import TrainingButton from "./TrainingButton";

interface TrainModelFirstViewConfig {
  textIds: string[];
  navigateToStep?: TabId;
}

const getConfig = (status: MlStage): TrainModelFirstViewConfig => {
  switch (status) {
    case MlStage.InsufficientData:
      return {
        textIds: [
          "content.model.notEnoughDataInfoBody1",
          "content.model.notEnoughDataInfoBody2",
        ],
        navigateToStep: TabId.Data,
      };
    case MlStage.RetrainingNeeded:
      return {
        textIds: ["content.model.retrainModelBody"],
      };
    default:
      return {
        textIds: ["content.model.trainModelBody"],
      };
  }
};

const TrainModelFirstView = () => {
  const navigate = useNavigate();
  const [{ stage }] = useMlStatus();
  const { onOpen: onOpenTrainModelDialog } = useTrainModelDialogs();

  const navigateToDataPage = useCallback(() => {
    navigate(createStepPageUrl(TabId.Data));
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
      {config.navigateToStep === TabId.Data ? (
        <Button variant="primary" onClick={navigateToDataPage}>
          <FormattedMessage id="content.model.addData" />
        </Button>
      ) : (
        <TrainingButton onClick={onOpenTrainModelDialog} />
      )}
    </VStack>
  );
};

export default TrainModelFirstView;

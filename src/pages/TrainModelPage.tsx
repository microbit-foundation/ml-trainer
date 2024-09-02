import { Heading, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import TrainingStatusView from "../components/TrainingStatusView";
import trainModelImage from "../images/train_model_black.svg";

const TrainModelPage = () => {
  return (
    <VStack flexGrow={1} alignItems="center" gap={10} bgColor="gray.25">
      <VStack gap={0}>
        <Image
          src={trainModelImage}
          opacity={0.4}
          pt={10}
          w="350px"
          h="249px"
          alt=""
        />
        <VStack gap={5}>
          <Heading as="h1" fontSize="2xl" fontWeight="bold">
            <FormattedMessage id="content.trainer.header" />
          </Heading>
          <Text textAlign="center" w="39rem">
            <FormattedMessage id="content.trainer.description" />
          </Text>
        </VStack>
      </VStack>
      <TrainingStatusView />
    </VStack>
  );
};

export default TrainModelPage;

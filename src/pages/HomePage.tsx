import { Grid, Heading, Image, Stack, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ResourceCard from "../components/ResourceCard";
import StartResumeActions from "../components/StartResumeActions";
import resourceGetStartedImage from "../images/resource-get-started.jpg";
import resourceIntroducingToolImage from "../images/resource-introducing-tool.jpg";
import { stepsConfig } from "../steps-config";

export const Paths = {
  HOME: "/",
  PLAYGROUND: "playground",
  INTRODUCING_TOOL: "resources/introducing-the-microbit-machine-learning-tool",
  GET_STARTED: "resources/get-started",
  DATA: "add-data",
  TRAINING: "train-model",
  MODEL: "test-model",
  FILTERS: "training/filters",
} as const;

const resources = [
  {
    titleId: "introducing-microbit-resource-title",
    path: Paths.INTRODUCING_TOOL,
    imgSrc: resourceIntroducingToolImage,
  },
  {
    titleId: "get-started-resource-title",
    path: Paths.GET_STARTED,
    imgSrc: resourceGetStartedImage,
  },
];

const HomePage = () => {
  const intl = useIntl();

  return (
    <DefaultPageLayout titleId="content.index.title">
      <VStack gap={10} maxW="75rem" m="auto" p={10}>
        <VStack justifyItems="center" justify="center" gap={5}>
          <Heading as="h1" fontSize="4xl" fontWeight="bold">
            <FormattedMessage id="homepage-title" />
          </Heading>
          <Text fontSize="xl">
            <FormattedMessage id="homepage-subtitle" />
          </Text>
        </VStack>
        <VStack width="100%" alignItems="center">
          <Stack
            width="100%"
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            px={10}
            gap={5}
          >
            {stepsConfig.map(({ id, imgSrc }, idx) => (
              <Step
                key={id}
                title={`${idx + 1}. ${intl.formatMessage({
                  id: `${id}-title`,
                })}`}
                imgSrc={imgSrc}
                description={intl.formatMessage({
                  id: `${id}-intro-description`,
                })}
              />
            ))}
          </Stack>
        </VStack>

        <Heading
          as="h2"
          fontSize="3xl"
          px={10}
          alignSelf={{ base: "center", lg: "start" }}
          fontWeight="bold"
        >
          <FormattedMessage id="resources" />
        </Heading>
        <Grid
          templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(3, 1fr)" }}
          px={10}
          gap={5}
        >
          {resources.map((r, idx) => (
            <ResourceCard {...r} key={idx} />
          ))}
        </Grid>
        <StartResumeActions />
      </VStack>
    </DefaultPageLayout>
  );
};

interface StepProps {
  title: string;
  imgSrc: string;
  description: string;
}

const Step = ({ title, imgSrc, description }: StepProps) => (
  <VStack justifyItems="center" alignItems="center" maxW="18rem" gap="1rem">
    <Heading as="h3" textAlign="center" fontSize="2xl" fontWeight="bold">
      {title}
    </Heading>
    <Image src={imgSrc} alt="" />
    <Text textAlign="center">{description}</Text>
  </VStack>
);

export default HomePage;

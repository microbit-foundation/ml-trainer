import {
  Box,
  BoxProps,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Text,
  useInterval,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout from "../components/DefaultPageLayout";
import PercentageDisplay from "../components/PercentageDisplay";
import PercentageMeter from "../components/PercentageMeter";
import RecordingGraph from "../components/RecordingGraph";
import ResourceCard from "../components/ResourceCard";
import YoutubeVideoEmbed from "../components/YoutubeVideoEmbed";
import { useDeployment } from "../deployment";
import { stage } from "../environment";
import { flags } from "../flags";
import blockImage from "../images/block.png";
import clap from "../images/clap-square.png";
import aiActivityTimer from "../images/resource-ai-activity-timer.png";
import simpleAiExerciseTimer from "../images/resource-simple-ai-exercise-timer.png";
import xyzGraph from "../images/xyz-graph.png";
import { createNewPageUrl } from "../urls";

const graphData = {
  x: [
    0.4, 0.152, -0.008, 0.056, -0.324, 1.604, 2.04, 0.92, 1.844, 1.872, 2.04,
    2.04, 2.04, 2.04, 0.196, -1.004, 0.928, 0.624, -0.052, -0.38, 0.08, -0.136,
    0.156, 0.316, -0.264, -0.28, 2.04, 2.04, 1.896, 2.04, 2.04, 2.04, 2.04,
    2.04, 1.484, -0.408, -0.424, 0.988, 0.412, -0.528, -0.568, 0.428, 0.44,
    0.364, 0.004, -0.028, -0.304, 2.04, 2.004, 0.98, 2.04, 2.04, 1.368, 2.04,
    2.04, 1.472, -1.328, 0.4, 0.904, -0.392, -0.2, 0.06, -0.044, -0.172, 0.076,
    -0.044, -0.316, 0.692, 2.04, 2.04, 2.04, 1.148, 1.1, 2.04, 2.04, 2.04,
    0.952, -0.68, 0.032, 0.48, -0.08, -0.068, 0.024, 0.336, 0.204, -0.1, -0.244,
    0.04, 1.168,
  ],
  y: [
    -0.752, -1.192, -1.212, -1.456, -0.972, -0.42, 0.292, 1.68, 0.544, -0.66,
    -1.148, -0.224, -0.784, -1.196, -0.888, 0.472, 1.172, -0.776, -0.86, 0.476,
    0.324, 0.228, 0.576, 0.68, 0.904, 0.708, -0.9, 0.02, 0.752, 0.424, -1.012,
    -0.44, -0.144, -0.032, -0.072, 0.764, 1.228, 0.872, 0.436, 0.616, 0.324,
    0.26, -0.416, -1.748, -2.04, -1.036, 0.596, 0.788, 0.46, 0.02, 0.676,
    -1.332, -1.112, -0.48, -0.548, -1.16, 0.516, 0.264, -0.72, -0.8, 0.488,
    0.868, 0.836, 0.404, 0.36, 0.276, 0.244, 0.348, 0.88, 1.468, -0.596, -1.248,
    -0.864, 0.068, -0.512, 0.092, 0.592, -0.024, 1.008, 0.432, 0.508, 0.76,
    0.568, 0.14, -0.348, -1.192, -1.528, -1.496, 0.38,
  ],
  z: [
    -0.408, -0.152, 0.06, -0.044, 2.04, -0.7, -1.548, 0.58, 0.62, 0.932, 0.764,
    0.408, 0.132, -1.004, 0.324, 2.04, 1.156, 0.156, 0.076, -0.232, -0.244,
    0.036, 0.056, 0.024, 1.044, 2.04, -2.012, 0.644, -0.44, 0.42, 0.672, 0.604,
    0.132, -0.432, 0, 1.176, 2.04, 0.152, 0.04, -0.544, 0.072, 0.116, 0.208,
    0.868, 0.816, 0.324, 2.04, -2.04, 1.536, -0.044, 0.444, 0.552, 0.784,
    -0.004, -0.604, -0.008, 2.04, 1.764, 0.044, 0.068, -0.02, -0.052, -0.052,
    0.024, -0.196, 0.28, 2.04, 0.704, -0.576, 0.432, 0.788, 0.88, 0.872, 0.22,
    0.288, -0.516, 0.348, 2.04, 1.892, 0.12, -0.04, -0.464, -0.104, -0.088,
    -0.084, 0.22, 0.74, 2.04, -0.096,
  ],
};

const HomePage = () => {
  const navigate = useNavigate();
  const handleGetStarted = useCallback(() => {
    navigate(createNewPageUrl());
  }, [navigate]);
  const intl = useIntl();
  const { appNameFull } = useDeployment();
  const microbitOrgBaseUrl =
    stage === "production"
      ? "https://microbit.org/"
      : "https://stage.microbit.org/";

  return (
    <DefaultPageLayout
      toolbarItemsRight={
        <Button variant="toolbar" onClick={handleGetStarted}>
          <FormattedMessage id="get-started-action" />
        </Button>
      }
    >
      <Container centerContent gap={16} p={8} maxW="container.lg">
        <HStack
          gap={5}
          flexDir={{ base: "column", lg: "row" }}
          w={{ base: "100%", lg: "unset" }}
        >
          <VStack
            flex="1"
            alignItems="flex-start"
            gap={5}
            w={{ base: "100%", lg: "unset" }}
          >
            <Heading as="h1" fontSize="5xl" fontWeight="bold">
              {appNameFull}
            </Heading>
            <Text fontSize="md" fontWeight="bold">
              <FormattedMessage id="homepage-subtitle" />
            </Text>
            <Text fontSize="md">
              <FormattedMessage id="homepage-description" />
            </Text>
            <Button
              size="lg"
              variant="primary"
              onClick={handleGetStarted}
              mt={5}
            >
              <FormattedMessage id="get-started-action" />
            </Button>
          </VStack>
          <Box flex="1" position="relative">
            <Image
              src={xyzGraph}
              borderRadius="lg"
              bgColor="white"
              pr={1}
              alt={intl.formatMessage({ id: "homepage-alt" })}
            />
            <Image
              height="55%"
              position="absolute"
              bottom={0}
              left={0}
              src={clap}
              borderRadius="md"
              pr={1}
              alt={intl.formatMessage({ id: "homepage-alt" })}
            />
          </Box>
        </HStack>
        <VStack spacing={8} w="100%" maxW="container.md">
          <Heading as="h2" textAlign="center">
            <FormattedMessage id="homepage-how-it-works" />
          </Heading>
          <Box w="100%" position="relative">
            <YoutubeVideoEmbed
              youtubeId="7DqaU_Qexy4"
              alt={intl.formatMessage({ id: "homepage-video-alt" })}
            />
          </Box>
          <Text fontSize="md">
            <FormattedMessage
              id="homepage-video-prompt"
              values={{ appNameFull }}
            />
          </Text>
        </VStack>
        <VStack gap={8}>
          <Heading as="h2" textAlign="center">
            <FormattedMessage id="homepage-step-by-step" />
          </Heading>
          <VStack
            gap={12}
            maxW="container.md"
            position="relative"
            role="image"
            aria-label={intl.formatMessage({ id: "steps-alt" })}
          >
            <Step
              title={intl.formatMessage({ id: "steps-collect-data" })}
              image={<CollectDataIllustration />}
            />
            <Box
              display={{ base: "flex", md: "contents" }}
              flexDir="row-reverse"
              gap={12}
            >
              <HStack
                gap={5}
                position={{ base: "unset", md: "absolute" }}
                right="-160px"
                top="130px"
              >
                <Arrow />
                <Text fontWeight="bold" fontSize="xl">
                  <FormattedMessage id="steps-train" />
                </Text>
              </HStack>
              <HStack
                gap={5}
                position={{ base: "unset", md: "absolute" }}
                left="-185px"
                top="130px"
              >
                <Text fontWeight="bold" fontSize="xl">
                  <FormattedMessage id="steps-improve" />
                </Text>
                <Arrow transform="rotate(180deg)" />
              </HStack>
            </Box>
            <Step
              title={intl.formatMessage({ id: "steps-test-model" })}
              image={<TestModelStepIllustration />}
            />
            <Step
              title={intl.formatMessage({ id: "steps-code" })}
              image={<CodeIllustration />}
            />
          </VStack>
        </VStack>
        {flags.homePageProjects && (
          <VStack gap={8}>
            <Heading as="h2" textAlign="center">
              <FormattedMessage id="homepage-projects" />
            </Heading>
            <HStack gap={5} flexDir={{ base: "column", lg: "row" }}>
              <ResourceCard
                title={intl.formatMessage({
                  id: "simple-ai-exercise-timer-resource-title",
                })}
                url={`${microbitOrgBaseUrl}projects/make-it-code-it/simple-ai-exercise-timer/`}
                imgSrc={simpleAiExerciseTimer}
              />
              <ResourceCard
                title={intl.formatMessage({
                  id: "ai-activity-timer-resource-title",
                })}
                url={`${microbitOrgBaseUrl}projects/make-it-code-it/ai-activity-timer/`}
                imgSrc={aiActivityTimer}
              />
            </HStack>
          </VStack>
        )}
      </Container>
    </DefaultPageLayout>
  );
};

interface StepProps {
  title: ReactNode;
  image: ReactNode;
}

const Step = ({ title, image }: StepProps) => (
  <VStack
    justifyContent="space-between"
    gap={5}
    border="1px"
    borderColor="gray.600"
    padding={5}
    borderRadius="lg"
  >
    {image}
    <Heading as="h2" textAlign="center" fontSize="xl">
      {title}
    </Heading>
  </VStack>
);

const CollectDataIllustration = () => {
  const props = {
    data: graphData,
    bgColor: "white",
    w: "158px",
  };
  return (
    <HStack w="200px" position="relative" mb="5">
      <RecordingGraph {...props} />
      <RecordingGraph {...props} position="absolute" left="20px" top="10px" />
      <RecordingGraph {...props} position="absolute" left="40px" top="20px" />
    </HStack>
  );
};

const TestModelStepIllustration = () => {
  const [value, setValue] = useState(0.75);
  const colorScheme = Math.round(value * 100) >= 80 ? "brand2.500" : undefined;
  useInterval(() => {
    setValue((value) => 0.8 * value + 0.2 * Math.min(1, 2.5 * Math.random()));
  }, 1500);
  return (
    <VStack
      w="200px"
      bgColor="white"
      borderRadius="md"
      justifyContent="space-between"
      alignItems="stretch"
      px={5}
      py={5}
      gap={4}
    >
      <PercentageDisplay
        value={value}
        alignSelf="center"
        colorScheme={colorScheme}
      />
      <PercentageMeter value={value} colorScheme={colorScheme} />
    </VStack>
  );
};

const CodeIllustration = () => {
  return (
    <Image src={blockImage} alt="" aspectRatio={288 / 172} width="200px" />
  );
};

const Arrow = (props: BoxProps) => {
  return (
    <Box
      color="brand.500"
      as="svg"
      w="65px"
      viewBox="0 0 122 345"
      fill="none"
      {...props}
    >
      <path
        d="M68.3096 8.20258C157.514 158.056 54.6817 305.962 39.1331 336.205M113.688 335.909C65.0131 336.347 39.948 336.396 38.4915 336.054C36.3068 335.542 28.664 299.328 8.96063 278.799"
        stroke="currentColor"
        strokeOpacity="0.9"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
};

export default HomePage;

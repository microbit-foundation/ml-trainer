import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout from "../components/DefaultPageLayout";
import ResourceCard from "../components/ResourceCard";
import YoutubeVideoEmbed from "../components/YoutubeVideoEmbed";
import { useDeployment } from "../deployment";
import { stage } from "../environment";
import { flags } from "../flags";
import clap from "../images/clap-square.png";
import processsDiagram from "../images/process-horizontal.png";
import aiActivityTimer from "../images/resource-ai-activity-timer.png";
import simpleAiExerciseTimer from "../images/resource-simple-ai-exercise-timer.png";
import xyzGraph from "../images/xyz-graph.png";
import { createNewPageUrl } from "../urls";

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
          <Image src={processsDiagram} />
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

export default HomePage;

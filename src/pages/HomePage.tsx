/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Link,
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
import { flags } from "../flags";
import clap from "../images/clap-hands.png";
import xyzGraph from "../images/xyz-graph.png";
import { createNewPageUrl } from "../urls";

import projectImage3 from "theme-package/images/ai-activity-timer.png";
import projectImage2 from "theme-package/images/simple-ai-exercise-timer.png";
import projectImage1 from "theme-package/images/ai-storytelling-friend.png";
import StepByStepIllustration from "../components/StepByStepIllustration";
import {
  landingPageUrl,
  projectUrl,
  userGuideUrl,
} from "../utils/external-links";
import { useSettings } from "../store";

const HomePage = () => {
  const navigate = useNavigate();
  const handleGetStarted = useCallback(() => {
    navigate(createNewPageUrl());
  }, [navigate]);
  const intl = useIntl();
  const [{ languageId }] = useSettings();
  const { appNameFull } = useDeployment();
  return (
    <DefaultPageLayout
      toolbarItemsRight={
        <Button variant="toolbar" onClick={handleGetStarted}>
          <FormattedMessage id="get-started-action" />
        </Button>
      }
    >
      <Container
        as="main"
        centerContent
        gap={20}
        p={8}
        pb={20}
        maxW="container.lg"
      >
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
            <Heading
              as="h1"
              fontSize="5xl"
              fontWeight="bold"
              variant="marketing"
            >
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
          <Box
            flex="1"
            position="relative"
            role="img"
            aria-label={intl.formatMessage({ id: "homepage-alt" })}
          >
            <Image
              src={xyzGraph}
              borderRadius="lg"
              bgColor="white"
              pr={1}
              alt={intl.formatMessage({ id: "homepage-alt-graph" })}
            />
            <Image
              height="100%"
              position="absolute"
              bottom={0}
              left={0}
              src={clap}
              borderRadius="md"
              pr={1}
              alt={intl.formatMessage({ id: "homepage-alt-hands" })}
            />
          </Box>
        </HStack>
        <VStack spacing={10} w="100%" maxW="container.md">
          <Heading as="h2" textAlign="center" variant="marketing">
            <FormattedMessage id="homepage-how-it-works" />
          </Heading>
          <Box w="100%" position="relative">
            <YoutubeVideoEmbed
              youtubeId="yWl3WxDE6QI"
              alt={intl.formatMessage({ id: "homepage-video-alt" })}
            />
          </Box>
          {flags.websiteContent && (
            <Text fontSize="md">
              <FormattedMessage
                id="homepage-how-it-works-paragraph"
                values={{
                  appNameFull,
                  link: (children) => (
                    <Link
                      color="brand.600"
                      textDecoration="underline"
                      href={userGuideUrl()}
                    >
                      {children}
                    </Link>
                  ),
                }}
              />
            </Text>
          )}
        </VStack>
        <VStack gap={10}>
          <Heading as="h2" textAlign="center" variant="marketing">
            <FormattedMessage id="homepage-step-by-step" />
          </Heading>
          <VStack
            position="relative"
            role="img"
            aria-label={intl.formatMessage({ id: "steps-alt" })}
          >
            <StepByStepIllustration />
          </VStack>
        </VStack>
        {flags.websiteContent && (
          <VStack gap={10}>
            <Heading as="h2" textAlign="center" variant="marketing">
              <FormattedMessage id="homepage-projects" />
            </Heading>
            <HStack gap={5} flexDir={{ base: "column", lg: "row" }}>
              <ResourceCard
                title={intl.formatMessage({
                  id: "ai-storytelling-friend-resource-title",
                })}
                url={projectUrl("ai-storytelling-friend", languageId)}
                imgSrc={projectImage1}
              />
              <ResourceCard
                title={intl.formatMessage({
                  id: "simple-ai-exercise-timer-resource-title",
                })}
                url={projectUrl("simple-ai-exercise-timer", languageId)}
                imgSrc={projectImage2}
              />
              <ResourceCard
                title={intl.formatMessage({
                  id: "ai-activity-timer-resource-title",
                })}
                url={projectUrl("ai-activity-timer", languageId)}
                imgSrc={projectImage3}
              />
            </HStack>
            <Text fontSize="md">
              <FormattedMessage
                id="homepage-projects-more"
                values={{
                  link: (children) => (
                    <Link
                      color="brand.600"
                      textDecoration="underline"
                      href={landingPageUrl(languageId)}
                    >
                      {children}
                    </Link>
                  ),
                }}
              />
            </Text>
          </VStack>
        )}
      </Container>
    </DefaultPageLayout>
  );
};

export default HomePage;

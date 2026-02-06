/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  LinkBox,
  LinkOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import orderBy from "lodash.orderby";
import { Suspense, useCallback, useRef } from "react";
import { RiAddLine, RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { Await, useLoaderData, useNavigate } from "react-router";
import CarouselRow from "../components/Carousel/CarouselRow";
import ClickableTooltip from "../components/ClickableTooltip";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingPage from "../components/LoadingPage";
import LoadProjectInput, {
  LoadProjectInputRef,
} from "../components/LoadProjectInput";
import ProjectCard from "../components/ProjectCard";
import { createResourceCards } from "../components/ResourceCards";
import { useLogging } from "../logging/logging-hooks";
import { useSettings, useStore } from "../store";
import { createDataSamplesPageUrl, createProjectsPageUrl } from "../urls";

const HomePage = () => {
  const { allProjectDataLoaded } = useLoaderData() as {
    allProjectDataLoaded: boolean;
  };
  const intl = useIntl();
  const [{ languageId }] = useSettings();

  return (
    <Suspense fallback={<LoadingPage />}>
      <Await resolve={allProjectDataLoaded}>
        <DefaultPageLayout
          toolbarItemsRight={<HomeToolbarItem />}
          menuItems={<HomeMenuItem />}
        >
          <CarouselRow
            actions={[<ImportProjectButton key="importProject" />]}
            carouselItems={[<NewProjectCard key="newProject" />]}
            containerMessageId="new-projects-row-carousel"
            titleId="new-projects-row-title"
          />
          <ProjectRow />
          <CarouselRow
            containerMessageId="project-ideas-row-carousel"
            carouselItems={createResourceCards(intl, languageId)}
            titleId="project-ideas-row-title"
          />
        </DefaultPageLayout>
      </Await>
    </Suspense>
  );
};

const ProjectRow = () => {
  const allProjectData = useStore((s) => s.allProjectData);
  if (allProjectData.length === 0) {
    return null;
  }
  return (
    <CarouselRow
      actions={[<ViewAllProjectsButton key="viewAll" />]}
      carouselItems={orderBy(allProjectData, "timestamp", "desc").map(
        (projectData) => (
          <ProjectCard key={projectData.id} projectData={projectData} />
        )
      )}
      containerMessageId="my-projects-row-carousel"
      titleElement={
        <HStack spacing={3}>
          <Heading as="h2" fontSize="3xl">
            <FormattedMessage id="my-projects-row-title" />
          </Heading>
          <ClickableTooltip
            isFocusable
            hasArrow
            placement="right"
            label={
              <VStack
                textAlign="left"
                alignContent="left"
                alignItems="left"
                m={3}
              >
                <Text>
                  <FormattedMessage id="project-storage-tooltip" />
                </Text>
              </VStack>
            }
          >
            <Icon opacity={0.7} h={5} w={5} as={RiInformationLine} />
          </ClickableTooltip>
        </HStack>
      }
    />
  );
};

const ViewAllProjectsButton = () => {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(createProjectsPageUrl());
  }, [navigate]);
  return <Button onClick={handleClick}>View all</Button>;
};

const NewProjectCard = () => {
  const newSession = useStore((s) => s.newSession);
  const navigate = useNavigate();
  const logging = useLogging();

  const handleStartNewSession = useCallback(async () => {
    logging.event({
      type: "session-open-new",
    });
    await newSession();
    navigate(createDataSamplesPageUrl());
  }, [logging, newSession, navigate]);

  return (
    <LinkBox>
      <Card flexGrow={1} overflow="hidden">
        <CardBody display="flex" background="brand.700" color="white">
          <VStack h="100%" w="100%" py={8} gap={3}>
            <Icon as={RiAddLine} h={10} w={10} />
            <LinkOverlay
              as={Button}
              fontSize="xl"
              onClick={handleStartNewSession}
              variant="unstyled"
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              <FormattedMessage id="newpage-new-project-title" />
            </LinkOverlay>
          </VStack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

const ImportProjectButton = () => {
  const loadProjectRef = useRef<LoadProjectInputRef>(null);
  const handleContinueSessionFromFile = useCallback(() => {
    loadProjectRef.current?.chooseFile("replaceProject");
  }, []);

  return (
    <>
      <LoadProjectInput ref={loadProjectRef} accept=".json,.hex" />
      <Button onClick={handleContinueSessionFromFile}>
        <FormattedMessage id="import-file-action" />
      </Button>
    </>
  );
};

export default HomePage;

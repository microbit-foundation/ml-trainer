/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  AspectRatio,
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
import { Suspense, useCallback, useRef, useState } from "react";
import { RiAddLine, RiFolderOpenLine, RiInformationLine } from "react-icons/ri";
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
import { NameProjectDialog } from "../components/NameProjectDialog";
import { untitledProjectName } from "../project-utils";
import { IconType } from "react-icons/lib";

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
  const numCardsDisplayed = 10;
  return (
    <CarouselRow
      actions={[
        <ImportProjectButton key="importProject" />,
        <ViewAllProjectsButton key="viewAll" />,
      ]}
      carouselItems={
        [
          <NewProjectCard key="new-project" />,
          ...orderBy(allProjectData, "timestamp", "desc")
            .map((projectData) => (
              <ProjectCard key={projectData.id} projectData={projectData} />
            ))
            .slice(0, numCardsDisplayed),
          allProjectData.length > numCardsDisplayed ? (
            <ViewAllProjectsCard key="view-all" />
          ) : undefined,
        ].filter(Boolean) as JSX.Element[]
      }
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
  return (
    <Button onClick={handleClick}>
      <FormattedMessage id="view-all-projects" />
    </Button>
  );
};

interface ActionCardProps {
  onClick: () => void;
  icon: IconType;
  textId: string;
}

const ActionCard = ({ onClick, icon, textId }: ActionCardProps) => {
  return (
    <LinkBox display="flex">
      <Card flexGrow={1} overflow="hidden">
        <CardBody display="flex" backgroundColor="brand.600" color="white">
          <VStack h="100%" w="100%" spacing={0}>
            {/* Ratio matches current recording icon / image */}
            <AspectRatio ratio={1591 / 1144} w="100%">
              <VStack>
                <Icon as={icon} h={20} w={20} />
              </VStack>
            </AspectRatio>
            <LinkOverlay
              as={Button}
              h={8}
              fontSize="xl"
              onClick={onClick}
              variant="unstyled"
              _focusVisible={{ boxShadow: "outline", outline: "none" }}
            >
              <FormattedMessage id={textId} />
            </LinkOverlay>
          </VStack>
        </CardBody>
      </Card>
    </LinkBox>
  );
};

const NewProjectCard = () => {
  const newSession = useStore((s) => s.newSession);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const logging = useLogging();

  const handleNameProjectSave = useCallback(
    async (projectName: string) => {
      logging.event({
        type: "session-open-new",
      });
      await newSession(projectName);
      navigate(createDataSamplesPageUrl());
    },
    [logging, newSession, navigate]
  );

  const handleOpenNameDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCloseNameDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <NameProjectDialog
        projectName={untitledProjectName}
        isOpen={isOpen}
        onClose={handleCloseNameDialog}
        onSave={handleNameProjectSave}
        helperText={null}
        confirmText={<FormattedMessage id="confirm-action" />}
      />
      <ActionCard
        onClick={handleOpenNameDialog}
        icon={RiAddLine}
        textId="newpage-new-project-title"
      />
    </>
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

const ViewAllProjectsCard = () => {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(createProjectsPageUrl());
  }, [navigate]);
  return (
    <ActionCard
      onClick={handleClick}
      icon={RiFolderOpenLine}
      textId="view-all-projects"
    />
  );
};

export default HomePage;

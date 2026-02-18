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
import { RefObject, Suspense, useCallback, useRef, useState } from "react";
import { IconType } from "react-icons/lib";
import { RiAddLine, RiFolderOpenLine, RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { Await, useLoaderData, useNavigate } from "react-router";
import CarouselRow from "../components/Carousel/CarouselRow";
import ClickableTooltip from "../components/ClickableTooltip";
import { ConfirmDialog } from "../components/ConfirmDialog";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { createHelpCards } from "../components/HelpCards";
import { createLessonCards } from "../components/LessonCards";
import LoadingPage from "../components/LoadingPage";
import LoadProjectInput, {
  LoadProjectInputRef,
} from "../components/LoadProjectInput";
import { NameProjectDialog } from "../components/NameProjectDialog";
import ProjectCard from "../components/ProjectCard";
import { createProjectIdeaCards } from "../components/ProjectIdeaCards";
import { useLogging } from "../logging/logging-hooks";
import { ProjectNameDialogReason, untitledProjectName } from "../project-utils";
import {
  loadProjectAndModelFromStorage,
  useSettings,
  useStore,
} from "../store";
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
          <ProjectRow />
          <CarouselRow
            containerMessageId="project-ideas-row-carousel"
            carouselItems={createProjectIdeaCards(intl, languageId)}
            titleId="project-ideas-row-title"
          />
          <CarouselRow
            containerMessageId="teacher-resources-row-carousel"
            carouselItems={createLessonCards(intl)}
            titleId="teacher-resources-row-title"
          />
          <CarouselRow
            containerMessageId="help-resources-row-carousel"
            carouselItems={createHelpCards(intl)}
            titleId="help-resources-row-title"
          />
        </DefaultPageLayout>
      </Await>
    </Suspense>
  );
};

const ProjectRow = () => {
  const numCardsDisplayed = 10;
  const navigate = useNavigate();
  const intl = useIntl();
  const allProjectData = useStore((s) => s.allProjectData);
  const renameProject = useStore((s) => s.setProjectName);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [projectForAction, setProjectForAction] = useState<string | null>(null);

  const handleOpenProject = useCallback(
    async (id?: string) => {
      if (id) {
        await loadProjectAndModelFromStorage(id);
        navigate(createDataSamplesPageUrl());
      }
    },
    [navigate]
  );

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogIsOpen(false);
    setProjectName("");
    setProjectForAction(null);
  }, []);

  const handleDeleteProject = useCallback(
    async (id?: string) => {
      if (id) {
        return deleteProject(id);
      }
      handleCloseConfirmDialog();
      if (projectForAction) {
        await deleteProject(projectForAction);
      }
    },
    [deleteProject, handleCloseConfirmDialog, projectForAction]
  );

  const [nameDialogIsOpen, setNameDialogIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [projectNameReason, setProjectNameReason] =
    useState<ProjectNameDialogReason>();

  const handleOpenNameProjectDialog = useCallback(
    (reason: ProjectNameDialogReason, id?: string) => {
      const project = allProjectData.find((p) => p.id === id);
      if (project) {
        setProjectNameReason(reason);
        setProjectName(project.name);
        setNameDialogIsOpen(true);
        setProjectForAction(project.id);
      }
    },
    [allProjectData]
  );

  const handleNameProjectDialogClose = useCallback(() => {
    setNameDialogIsOpen(false);
    setProjectForAction(null);
  }, []);

  const clearFinalFocusRef = useCallback(() => {
    setFinalFocusRef(undefined);
  }, []);

  const handleNameProjectSave = useCallback(
    async (name: string) => {
      if (projectForAction) {
        if (projectNameReason === "rename") {
          await renameProject(name, projectForAction);
        } else {
          await duplicateProject(projectForAction, name);
        }
      }
      handleNameProjectDialogClose();
    },
    [
      duplicateProject,
      handleNameProjectDialogClose,
      projectForAction,
      projectNameReason,
      renameProject,
    ]
  );

  const [finalFocusRef, setFinalFocusRef] = useState<
    RefObject<HTMLElement> | undefined
  >();

  const [confirmDialogIsOpen, setConfirmDialogIsOpen] = useState(false);

  const handleOpenConfirmDialog = useCallback(
    (id?: string) => {
      const project = allProjectData.find((p) => p.id === id);
      if (project) {
        setProjectName(project.name);
        setConfirmDialogIsOpen(true);
        setProjectForAction(project.id);
      }
    },
    [allProjectData]
  );

  return (
    <>
      <NameProjectDialog
        projectName={projectName}
        isOpen={nameDialogIsOpen}
        onClose={handleNameProjectDialogClose}
        onCloseComplete={clearFinalFocusRef}
        onSave={handleNameProjectSave}
        finalFocusRef={finalFocusRef}
        heading={
          <FormattedMessage
            id={
              projectNameReason === "rename"
                ? "rename-project-heading"
                : "duplicate-project-heading"
            }
          />
        }
        helperText={null}
        confirmText={
          <FormattedMessage
            id={
              projectNameReason === "rename"
                ? "rename-project-action"
                : "duplicate-project-action"
            }
          />
        }
      />
      <ConfirmDialog
        isOpen={confirmDialogIsOpen}
        heading={intl.formatMessage({
          id: "delete-project-confirm-heading",
        })}
        body={
          <Text>
            <FormattedMessage
              id="delete-project-confirm-text"
              values={{ project: projectName }}
            />
          </Text>
        }
        onConfirm={() => handleDeleteProject()}
        onCancel={handleCloseConfirmDialog}
        onCloseComplete={clearFinalFocusRef}
        finalFocusRef={finalFocusRef}
      />
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
                <ProjectCard
                  key={projectData.id}
                  projectData={projectData}
                  onDeleteProject={handleOpenConfirmDialog}
                  onRenameDuplicateProject={handleOpenNameProjectDialog}
                  onOpenProject={handleOpenProject}
                  setFinalFocusRef={setFinalFocusRef}
                />
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
            <Heading as="h2" size="lg">
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
    </>
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
    <LinkBox h="100%" display="flex">
      <Card flexGrow={1} overflow="hidden" minH="233px">
        <CardBody display="flex" backgroundColor="brand.600" color="white">
          <VStack h="100%" w="100%" spacing={0} justifyContent="space-evenly">
            <VStack>
              <Icon as={icon} h={20} w={20} />
            </VStack>
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
        heading={<FormattedMessage id="create-project-dialog-heading" />}
        confirmText={<FormattedMessage id="create-project" />}
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

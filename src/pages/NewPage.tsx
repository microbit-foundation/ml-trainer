/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { RiAddLine, RiFolderOpenLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadProjectInput, {
  LoadProjectInputRef,
} from "../components/LoadProjectInput";
import NewPageChoice from "../components/NewPageChoice";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";
import { useStoreProjects } from "../store-persistence-hooks";
import { ProjectItem } from "../project-persistence/ProjectItem";
import ProjectHistoryModal from "../project-persistence/ProjectHistoryModal";
import { ProjectEntry } from "../project-persistence/project-list-db";
import RenameProjectModal from "../project-persistence/RenameProjectModal";
import { useProjectList } from "../project-persistence/project-list-hooks";
import { useProjectHistory } from "../project-persistence/project-history-hooks";

const NewPage = () => {
  const newSession = useStore((s) => s.newSession);
  const navigate = useNavigate();
  const logging = useLogging();
  const { loadProject, newProject } = useStoreProjects();
  const [showProjectHistory, setShowProjectHistory] =
    useState<ProjectEntry | null>(null);
  const [showProjectRename, setShowProjectRename] =
    useState<ProjectEntry | null>(null);

  const { projectList, deleteProject, setProjectName } = useProjectList();
  const { loadRevision } = useProjectHistory();

  const handleOpenSession = useCallback(
    async (projectId: string) => {
      logging.event({
        type: "session-open-saved",
      });
      await loadProject(projectId);
      navigate(createDataSamplesPageUrl());
    },
    [logging, navigate, loadProject]
  );

  const handleOpenRevision = useCallback(
    async (projectId: string, revisionId: string) => {
      logging.event({
        type: "session-open-revision",
      });

      await loadRevision(projectId, revisionId);
      navigate(createDataSamplesPageUrl());
    },
    [logging, navigate, loadRevision]
  );

  const loadProjectRef = useRef<LoadProjectInputRef>(null);
  const handleContinueSessionFromFile = useCallback(() => {
    loadProjectRef.current?.chooseFile();
  }, []);

  const handleStartNewSession = useCallback(async () => {
    logging.event({
      type: "session-open-new",
    });
    await newProject();
    newSession();
    navigate(createDataSamplesPageUrl());
  }, [logging, newSession, navigate, newProject]);

  const intl = useIntl();
  const continueSessionTitle = intl.formatMessage({
    id: "newpage-continue-session-title",
  });
  const newSessionTitle = intl.formatMessage({
    id: "newpage-new-session-title",
  });

  return (
    <DefaultPageLayout
      toolbarItemsRight={<HomeToolbarItem />}
      menuItems={<HomeMenuItem />}
    >
      <LoadProjectInput ref={loadProjectRef} accept=".json,.hex" />
      <VStack as="main" alignItems="center">
        <Container maxW="1180px" alignItems="stretch" p={4} mt={8}>
          <VStack alignItems="stretch" w="100%">
            <Heading as="h1" fontSize="4xl" fontWeight="bold">
              <FormattedMessage id="newpage-title" />
            </Heading>
            <Heading as="h2" fontSize="2xl" mt={8}>
              <FormattedMessage id="newpage-section-one-title" />
            </Heading>
            <HStack
              w="100%"
              gap={8}
              alignItems="stretch"
              mt={3}
              flexDir={{ base: "column", lg: "row" }}
            >
              <NewPageChoice
                onClick={handleStartNewSession}
                label={newSessionTitle}
                disabled={false}
                icon={<Icon as={RiAddLine} h={20} w={20} />}
              >
                <Text>
                  <FormattedMessage id="newpage-new-session-subtitle" />
                </Text>
              </NewPageChoice>
              <NewPageChoice
                onClick={handleContinueSessionFromFile}
                label={continueSessionTitle}
                icon={<Icon as={RiFolderOpenLine} h={20} w={20} />}
              >
                <Text>
                  <FormattedMessage id="newpage-continue-session-subtitle" />
                </Text>
              </NewPageChoice>
            </HStack>

            <Heading as="h2" fontSize="2xl" mt={8}>
              Your projects
            </Heading>
            <Grid
              position="relative"
              backgroundColor="whitesmoke"
              templateColumns="repeat(auto-fill, 400px)"
            >
              {projectList?.map((proj) => (
                <ProjectItem
                  key={proj.id}
                  project={proj}
                  loadProject={() => {
                    void handleOpenSession(proj.id);
                  }}
                  deleteProject={deleteProject}
                  renameProject={() => setShowProjectRename(proj)}
                  showHistory={() => setShowProjectHistory(proj)}
                />
              ))}
            </Grid>
          </VStack>
        </Container>
      </VStack>
      <ProjectHistoryModal
        isOpen={showProjectHistory !== null}
        onLoadRequest={handleOpenRevision}
        onDismiss={() => setShowProjectHistory(null)}
        projectInfo={showProjectHistory}
      />
      <RenameProjectModal
        isOpen={showProjectRename !== null}
        onDismiss={() => setShowProjectRename(null)}
        projectInfo={showProjectRename}
        handleRename={async (projectId, projectName) => {
          await setProjectName(projectId, projectName);
          setShowProjectRename(null);
        }}
      />
    </DefaultPageLayout>
  );
};

export default NewPage;

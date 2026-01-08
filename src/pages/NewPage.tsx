/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Card,
  CardBody,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, Suspense, useCallback, useRef, useState } from "react";
import { RiAddLine, RiFolderOpenLine, RiRestartLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { Await, useAsyncValue, useLoaderData, useNavigate } from "react-router";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingAnimation from "../components/LoadingAnimation";
import LoadProjectInput, {
  LoadProjectInputRef,
} from "../components/LoadProjectInput";
import NewPageChoice from "../components/NewPageChoice";
import { flags } from "../flags";
import { useProjectName } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import { ProjectData, ProjectDataWithActions, StoreAction } from "../storage";
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

const NewPage = () => {
  const existingSessionTimestamp = useStore((s) => s.timestamp);
  const projectName = useProjectName();
  const newSession = useStore((s) => s.newSession);
  const navigate = useNavigate();
  const logging = useLogging();
  const { allProjectData } = useLoaderData() as {
    allProjectData: ProjectData[];
  };

  const handleOpenLastSession = useCallback(() => {
    logging.event({
      type: "session-open-last",
    });
    navigate(createDataSamplesPageUrl());
  }, [logging, navigate]);

  const loadProjectRef = useRef<LoadProjectInputRef>(null);
  const handleContinueSessionFromFile = useCallback(() => {
    loadProjectRef.current?.chooseFile("replaceProject");
  }, []);

  const handleStartNewSession = useCallback(async () => {
    logging.event({
      type: "session-open-new",
    });
    await newSession();
    navigate(createDataSamplesPageUrl());
  }, [logging, newSession, navigate]);

  const intl = useIntl();
  const lastSessionTitle = intl.formatMessage({
    id: "newpage-last-session-title",
  });
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
                onClick={handleOpenLastSession}
                label={lastSessionTitle}
                disabled={!existingSessionTimestamp}
                icon={<Icon as={RiRestartLine} h={20} w={20} />}
              >
                {existingSessionTimestamp ? (
                  <Stack mt="auto">
                    <Text>
                      <FormattedMessage
                        id="newpage-last-session-name"
                        values={{
                          strong: (chunks: ReactNode) => (
                            <Text as="span" fontWeight="bold">
                              {chunks}
                            </Text>
                          ),
                          name: projectName,
                        }}
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="newpage-last-session-date"
                        values={{
                          strong: (chunks: ReactNode) => (
                            <Text as="span" fontWeight="bold">
                              {chunks}
                            </Text>
                          ),
                          date: new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                          }).format(existingSessionTimestamp),
                        }}
                      />
                    </Text>
                  </Stack>
                ) : (
                  <Text>
                    <FormattedMessage id="newpage-last-session-none" />
                  </Text>
                )}
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
              <FormattedMessage id="newpage-section-two-title" />
            </Heading>
            <HStack
              alignItems="stretch"
              mt={3}
              gap={8}
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
              <Box flex="1" />
            </HStack>
            {flags.multipleProjects && (
              <Suspense fallback={<LoadingAnimation />}>
                <Await resolve={allProjectData}>
                  <ProjectsList />
                </Await>
              </Suspense>
            )}
          </VStack>
        </Container>
      </VStack>
    </DefaultPageLayout>
  );
};

const ProjectsList = () => {
  const data = useAsyncValue() as ProjectDataWithActions[];
  const [projects, setProjects] = useState(data);
  const deleteProject = useStore((s) => s.deleteProject);

  const handleDeleteProject = useCallback(
    async (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      await deleteProject(id);
    },
    [deleteProject]
  );

  return (
    <>
      <Heading as="h2" fontSize="2xl" mt={8}>
        Projects
      </Heading>
      <Grid mt={3} gap={3} templateColumns="repeat(5, 1fr)">
        {projects.map((projectData) => (
          <GridItem key={projectData.id} display="flex">
            <ProjectCard
              id={projectData.id}
              name={projectData.name}
              actions={projectData.actions}
              updatedAt={projectData.timestamp}
              onDeleteProject={handleDeleteProject}
            />
          </GridItem>
        ))}
      </Grid>
    </>
  );
};

interface ProjectCard {
  id: string;
  name: string;
  actions: StoreAction[];
  updatedAt: number;
  onDeleteProject: (id: string) => Promise<void>;
}

const ProjectCard = ({
  id,
  name,
  actions,
  updatedAt,
  onDeleteProject,
}: ProjectCard) => {
  const navigate = useNavigate();

  const handleLoadProject = useCallback(
    async (_e: React.MouseEvent) => {
      await loadProjectAndModelFromStorage(id);
      navigate(createDataSamplesPageUrl());
    },
    [id, navigate]
  );

  const handleDeleteProject = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await onDeleteProject(id);
    },
    [id, onDeleteProject]
  );

  return (
    <Card onClick={handleLoadProject} cursor="pointer" flexGrow={1}>
      <IconButton
        aria-label="Delete project"
        onClick={handleDeleteProject}
        icon={<DeleteIcon />}
        position="absolute"
        right={1}
        top={1}
        borderRadius="sm"
        border="none"
      />
      <CardBody display="flex">
        <Stack h="100%">
          <Heading as="h3" fontSize="xl">
            {name}
          </Heading>
          <Text mb="auto">
            Actions:{" "}
            {actions.length > 0
              ? actions.map((a) => a.name).join(", ")
              : "none"}
          </Text>
          <Text>{`Last edited: ${new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(updatedAt)}`}</Text>
          <Text fontSize="xs" color="gray.600">
            id: {id}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default NewPage;

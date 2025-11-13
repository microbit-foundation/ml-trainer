/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useProjectStorage } from "../project-persistence/ProjectStorageProvider";
import { ProjectItem } from "../project-persistence/ProjectItem";
import { HistoryList } from "../project-persistence/project-history-db";

const NewPage = () => {
  const newSession = useStore((s) => s.newSession);
  const navigate = useNavigate();
  const logging = useLogging();
  const { loadProject, newProject } = useStoreProjects();
  const [showProjectHistory, setShowProjectHistory] = useState<string | null>(
    null
  );
  const [projectHistoryList, setProjectHistoryList] =
    useState<HistoryList | null>();

  const { projectList, deleteProject, getHistory } = useProjectStorage();

  (window as any).newProject = newProject;
  (window as any).loadProject = loadProject;

  useEffect(() => {
    const getProjectHistory = async () => {
      if (showProjectHistory === null) {
        setProjectHistoryList(null);
        return;
      }
      const historyList = await getHistory(showProjectHistory);
      setProjectHistoryList(historyList);
    };
    void getProjectHistory();
  }, [showProjectHistory]);

  const handleOpenSession = useCallback(() => {
    logging.event({
      type: "session-open-saved",
    });
    navigate(createDataSamplesPageUrl());
  }, [logging, navigate]);

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
  }, [logging, newSession, navigate]);

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
                  loadProject={async () => {
                    await loadProject(proj.id);
                    handleOpenSession();
                  }}
                  deleteProject={deleteProject}
                  showHistory={() => setShowProjectHistory(proj.id)}
                />
              ))}
            </Grid>
          </VStack>
        </Container>
      </VStack>

      <Modal
        isOpen={showProjectHistory !== null}
        onClose={() => setShowProjectHistory(null)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Project history</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {showProjectHistory} :{" "}
            {JSON.stringify(
              projectHistoryList?.map((ph) => ({
                timestamp: ph.timestamp,
                revisionId: ph.revisionId,
                parentId: ph.parentId,
              }))
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => setShowProjectHistory(null)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DefaultPageLayout>
  );
};

export default NewPage;

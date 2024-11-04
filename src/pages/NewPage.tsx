import {
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useRef } from "react";
import { RiAddLine, RiFolderOpenLine, RiRestartLine } from "react-icons/ri";
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
import { defaultProjectNameId } from "../project-name";
import { useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

const NewPage = () => {
  const existingSessionTimestamp = useStore((s) => s.timestamp);
  const projectName = useStore(
    (s) => s.project.header?.name ?? defaultProjectNameId
  );
  const newSession = useStore((s) => s.newSession);
  const navigate = useNavigate();
  const logging = useLogging();

  const handleOpenLastSession = useCallback(() => {
    logging.event({
      type: "session-open-last",
    });
    navigate(createDataSamplesPageUrl());
  }, [logging, navigate]);

  const loadProjectRef = useRef<LoadProjectInputRef>(null);
  const handleContinueSessionFromFile = useCallback(() => {
    loadProjectRef.current?.chooseFile();
  }, []);

  const handleStartNewSession = useCallback(() => {
    logging.event({
      type: "session-open-new",
    });
    newSession();
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
      <VStack alignItems="center">
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
          </VStack>
        </Container>
      </VStack>
    </DefaultPageLayout>
  );
};

export default NewPage;

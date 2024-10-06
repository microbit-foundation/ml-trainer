import {
  Box,
  BoxProps,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useCallback } from "react";
import { RiAddLine, RiFolderOpenLine, RiRestartLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout from "../components/DefaultPageLayout";
import NewPageChoice from "../components/NewPageChoice";
import { useConnectionStage } from "../connection-stage-hooks";
import { SessionPageId } from "../pages-config";
import { useHasGestures, useStore } from "../store";
import { createSessionPageUrl } from "../urls";

const NewPage = () => {
  const newSession = useStore((s) => s.newSession);
  const hasExistingSession = useHasGestures();
  const projectName = useStore((s) => s.project.header?.name ?? "Untitled");
  const startOverWarningDialogDisclosure = useDisclosure();
  const navigate = useNavigate();
  const { actions: connStageActions } = useConnectionStage();

  const handleNavigateToAddData = useCallback(() => {
    navigate(createSessionPageUrl(SessionPageId.DataSamples));
  }, [navigate]);

  const handleStartNewSession = useCallback(() => {
    startOverWarningDialogDisclosure.onClose();
    newSession();
    handleNavigateToAddData();
    connStageActions.startConnect();
  }, [
    startOverWarningDialogDisclosure,
    newSession,
    handleNavigateToAddData,
    connStageActions,
  ]);

  const onClickStartNewSession = useCallback(() => {
    if (hasExistingSession) {
      startOverWarningDialogDisclosure.onOpen();
    } else {
      handleStartNewSession();
    }
  }, [
    handleStartNewSession,
    hasExistingSession,
    startOverWarningDialogDisclosure,
  ]);

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
      toolbarItemsRight={<>{/* This should be the home button only */}</>}
    >
      <VStack alignItems="center">
        <Container
          maxW="container.xl"
          alignItems="stretch"
          zIndex={1}
          p={4}
          mt={8}
        >
          <VStack alignItems="stretch" w="100%">
            <Heading as="h1" fontSize="4xl" fontWeight="bold">
              <FormattedMessage id="newpage-title" />
            </Heading>
            <Heading as="h2" fontSize="2xl" mt={8}>
              <FormattedMessage id="newpage-section-one-title" />
            </Heading>
            <HStack w="100%" gap={8} alignItems="stretch" mt={3}>
              <NewPageChoice
                onClick={handleNavigateToAddData}
                label={lastSessionTitle}
                disabled={!hasExistingSession}
                icon={<Icon as={RiRestartLine} h={20} w={20} />}
              >
                <SetupFormSection
                  title={lastSessionTitle}
                  justifyContent="space-between"
                  description={
                    hasExistingSession ? (
                      <Stack>
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
                              }).format(Date.now()), // TODO: track timestamp
                            }}
                          />
                        </Text>
                      </Stack>
                    ) : (
                      <Text>
                        <FormattedMessage id="newpage-last-session-none" />
                      </Text>
                    )
                  }
                />
              </NewPageChoice>
              <NewPageChoice
                onClick={onClickStartNewSession}
                label={continueSessionTitle}
                icon={<Icon as={RiFolderOpenLine} h={20} w={20} />}
              >
                <SetupFormSection
                  title={continueSessionTitle}
                  description={
                    <Text>
                      <FormattedMessage id="newpage-continue-session-subtitle" />
                    </Text>
                  }
                />
              </NewPageChoice>
            </HStack>
            <Heading as="h2" fontSize="2xl" mt={8}>
              <FormattedMessage id="newpage-section-two-title" />
            </Heading>
            <HStack alignItems="stretch" mt={3} gap={8}>
              <NewPageChoice
                onClick={onClickStartNewSession}
                label={newSessionTitle}
                disabled={false}
                icon={<Icon as={RiAddLine} h={20} w={20} />}
              >
                <SetupFormSection
                  title={newSessionTitle}
                  description={
                    <Text>
                      <FormattedMessage id="newpage-new-session-subtitle" />
                    </Text>
                  }
                />
              </NewPageChoice>
              <Box flex="1" />
            </HStack>
          </VStack>
        </Container>
      </VStack>
    </DefaultPageLayout>
  );
};

interface SetupFormSectionProps extends BoxProps {
  title: string;
  description: ReactNode;
}

const SetupFormSection = ({
  title,
  description,
  ...rest
}: SetupFormSectionProps) => (
  <Stack as="section" py={5} px={5} minH={40} flex="1 1 auto" {...rest}>
    <Heading as="h3" fontSize="xl">
      {title}
    </Heading>
    {description}
  </Stack>
);

export default NewPage;

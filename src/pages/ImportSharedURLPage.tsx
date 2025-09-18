import {
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";
import { ButtonWithLoading } from "../components/ButtonWithLoading";
import LoadingAnimation from "../components/LoadingAnimation";
import { Header, ScriptText } from "@microbit/makecode-embed/vanilla";
import { createDataSamplesPageUrl } from "../urls";
import { useProject } from "../hooks/project-hooks";

const enum SharedState {
  None = 0,
  GettingHeader = 1,
  GettingProject = 2,
  Complete = 3,
  Failed = 4,
}

export const ImportSharedURLPage = () => {
  const { shortId } = useParams();
  const log = useLogging();

  const navigate = useNavigate();
  const [sharedState, setSharedState] = useState(SharedState.None);

  const [header, setHeader] = useState<Header>();
  const [projectText, setProjectText] = useState<ScriptText>();

  const [name, setName] = useState("Not Loaded");
  const loadProject = useStore((s) => s.loadProject);

  const handleStartSession = useCallback(() => {
    if (!header || !projectText) return;
    loadProject({ header: { ...header, name }, text: projectText }, name);
    navigate(createDataSamplesPageUrl(), { replace: true });
  }, [loadProject, header, projectText, name, navigate]);

  useEffect(() => {
    if (!shortId) return;
    setSharedState(SharedState.GettingHeader);
    log.event({
      type: "import-shared-project",
      detail: { shortId },
    });
    fetchSharedHeader(shortId)
      .then((header) => {
        setSharedState(SharedState.GettingProject);
        setHeader(header);
        setName(header.name);
        log.event({
          type: "import-shared-project",
          detail: { shortId },
        });
        return fetchSharedProjectText(header.id);
      })
      .then((text) => {
        setSharedState(SharedState.Complete);
        setProjectText(text);
      })
      .catch((e) => {
        log.error("Did not load shared project for import");
        log.error(e);
        setSharedState(SharedState.Failed);
      });
  }, [log, shortId]);

  if (sharedState < SharedState.GettingProject)
    return (
      <DefaultPageLayout
        titleId="import-shared-url-title"
        toolbarItemsRight={<HomeToolbarItem />}
        menuItems={<HomeMenuItem />}
      >
        <VStack as="main" justifyContent="center" m={[0, 5, 20]}>
          <Heading as="h1" mb={5}>
            <FormattedMessage id="import-shared-url-title" />
          </Heading>
          <LoadingAnimation />
        </VStack>
      </DefaultPageLayout>
    );

  return (
    <DefaultPageLayout
      titleId="import-shared-url-title"
      toolbarItemsRight={<HomeToolbarItem />}
      menuItems={<HomeMenuItem />}
    >
      <VStack as="main" justifyContent="center">
        <Stack
          bgColor="white"
          spacing={5}
          m={[0, 5, 20]}
          borderRadius={[0, "20px"]}
          borderWidth={[null, 1]}
          borderBottomWidth={1}
          borderColor={[null, "gray.300"]}
          py={[5, 8]}
          px={[3, 5, 8]}
          minW={[null, null, "xl"]}
          alignItems="stretch"
          width={["unset", "unset", "2xl", "2xl"]}
          maxW="2xl"
        >
          <Heading as="h1" mb={5}>
            <FormattedMessage id="import-shared-url-title" />
          </Heading>
          {sharedState === SharedState.Failed && (
            <Text>Error loading project</Text>
          )}
          {sharedState === SharedState.GettingHeader && <LoadingAnimation />}
          {sharedState >= SharedState.GettingProject && (
            <ProjectLoadDetails
              name={name}
              setName={setName}
              sharedState={sharedState}
              handleStartSession={handleStartSession}
            />
          )}
        </Stack>
      </VStack>
    </DefaultPageLayout>
  );
};

interface ProjectLoadDetailsProps {
  name: string;
  setName: (name: string) => void;
  sharedState: SharedState;
  handleStartSession: () => void;
}
const ProjectLoadDetails = ({
  name,
  setName,
  sharedState,
  handleStartSession,
}: ProjectLoadDetailsProps) => {
  const intl = useIntl();
  const timestamp = useStore((s) => s.timestamp);
  const nameLabel = intl.formatMessage({ id: "name-text" });
  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex();
  }, [saveHex]);

  return (
    <>
      {timestamp !== undefined && (
        <Text>
          <FormattedMessage
            id="new-session-setup-description"
            values={{
              link: (chunks: ReactNode) => (
                <Button
                  onClick={handleSave}
                  variant="link"
                  color="brand.600"
                  textDecoration="underline"
                >
                  {chunks}
                </Button>
              ),
            }}
          />
        </Text>
      )}
      <Stack py={2} spacing={5}>
        <Heading size="md" as="h2">
          <FormattedMessage id="name-text" />
        </Heading>
        <Input
          aria-label={nameLabel}
          minW="25ch"
          value={name}
          name="name-text"
          placeholder={nameLabel}
          size="lg"
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Text>
          <FormattedMessage
            id="third-party-content-description"
            values={{
              link: (chunks: ReactNode) => (
                <Button
                  onClick={() => {}}
                  variant="link"
                  color="brand.600"
                  textDecoration="underline"
                >
                  {chunks}
                </Button>
              ),
            }}
          />
        </Text>
      </Stack>
      <HStack pt={5} justifyContent="flex-end">
        <ButtonWithLoading
          isDisabled={sharedState !== SharedState.Complete}
          isLoading={
            sharedState === SharedState.GettingHeader ||
            sharedState === SharedState.GettingProject
          }
          variant="primary"
          onClick={handleStartSession}
          size="lg"
        >
          <FormattedMessage id="start-session-action" />
        </ButtonWithLoading>
      </HStack>
    </>
  );
};

const fetchSharedHeader = async (shortId: string): Promise<Header> => {
  const headerResponse = await fetch(`https://www.makecode.com/api/${shortId}`);
  if (headerResponse.status !== 200) {
    throw "Network errorr";
  }
  const header = (await headerResponse.json()) as Header;
  if (!header || !header.id || !header.name) {
    return Promise.reject("Incorrect header data");
  }
  return header;
};

const fetchSharedProjectText = async (longId: string): Promise<ScriptText> => {
  const textResponse = await fetch(
    `https://www.makecode.com/api/${longId}/text`
  );
  if (textResponse.status !== 200) {
    throw "Network errorr";
  }
  const text = (await textResponse.json()) as ScriptText;
  if (typeof text !== "object") {
    throw "Error downloding project";
  }
  return text;
};

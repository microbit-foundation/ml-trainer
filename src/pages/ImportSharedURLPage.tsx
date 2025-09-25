import {
  Alert,
  Button,
  Grid,
  Heading,
  HStack,
  HTMLChakraProps,
  Input,
  Link,
  Stack,
  StackProps,
  Text,
  TextProps,
  VStack,
} from "@chakra-ui/react";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useLogging } from "../logging/logging-hooks";
import { useSettings, useStore } from "../store";
import { ButtonWithLoading } from "../components/ButtonWithLoading";
import LoadingAnimation from "../components/LoadingAnimation";
import {
  Header,
  MakeCodeProject,
  ScriptText,
} from "@microbit/makecode-embed/vanilla";
import { createDataSamplesPageUrl } from "../urls";
import { useProject } from "../hooks/project-hooks";
import { ActionData, DatasetEditorJsonFormat } from "../model";
import DataSamplesTableRow from "../components/DataSamplesTableRow";
import { MakeCodeRenderBlocksProvider } from "@microbit/makecode-embed";
import { getMakeCodeLang } from "../settings";
import CodeViewCard from "../components/CodeViewCard";
import ErrorPage from "../components/ErrorPage";

const enum SharedState {
  None = 0,
  GettingHeader = 1,
  GettingProject = 2,
  Complete = 3,
  Failed = 4,
}

const contentStackProps: Partial<StackProps> = {
  bgColor: "white",
  spacing: 5,
  m: [20],
  borderRadius: [0, "20px"],
  borderWidth: [null, 1],
  borderBottomWidth: 1,
  borderColor: [null, "gray.300"],
  p: [0, 10, 20],
  minW: [null, null, "xl"],
  alignItems: "stretch",
  width: ["full", "full", "3xl", "4xl"],
};

const readableProps: Partial<TextProps> = {
  width: ["full", "65ch"],
};

export const ImportSharedURLPage = () => {
  const [name, setName] = useState("Not Loaded");
  const logging = useLogging();
  const navigate = useNavigate();
  const loadProject = useStore((s) => s.loadProject);
  const { sharedState, header, dataset, projectText } =
    useProjectPreload(setName);
  const { shortId } = useParams();

  const onStartSession = useCallback(() => {
    if (!header || !projectText) return;
    loadProject({ header: { ...header, name }, text: projectText }, name);
    logging.event({
      type: "import-shared-project-complete",
      detail: { shortId },
    });
    navigate(createDataSamplesPageUrl(), { replace: true });
  }, [loadProject, header, projectText, name, navigate, logging, shortId]);

  if (sharedState === SharedState.Failed) {
    return <ErrorPreloading />;
  }

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
      <VStack as="main" justifyContent="center" paddingBottom={20}>
        <Stack {...contentStackProps} mb="5">
          <Heading as="h1" mb={5}>
            <FormattedMessage id="import-shared-url-title" />
          </Heading>
          {sharedState === SharedState.GettingHeader && <LoadingAnimation />}
          {sharedState >= SharedState.GettingProject && (
            <>
              <ProjectLoadDetails name={name} setName={setName} />
              <StartSessionButton
                onStartSession={onStartSession}
                isDisabled={sharedState !== SharedState.Complete}
                isLoading={
                  sharedState === SharedState.GettingHeader ||
                  sharedState === SharedState.GettingProject
                }
              />
            </>
          )}
          {sharedState === SharedState.Complete && (
            <>
              {dataset && <PreviewData dataset={dataset} />}
              <MakeCodePreview
                project={{
                  header,
                  text: projectText,
                }}
              />
              <StartSessionButton
                onStartSession={onStartSession}
                isDisabled={false}
                isLoading={false}
              />
            </>
          )}
        </Stack>
        {sharedState === SharedState.Complete && (
          <Stack>
            <Alert status="info">
              <FormattedMessage id="third-party-content-description" />
            </Alert>
          </Stack>
        )}
      </VStack>
    </DefaultPageLayout>
  );
};

interface ProjectLoadDetailsProps {
  name: string;
  setName: (name: string) => void;
}
const ProjectLoadDetails = ({ name, setName }: ProjectLoadDetailsProps) => {
  const intl = useIntl();
  const timestamp = useStore((s) => s.timestamp);
  const nameLabel = intl.formatMessage({ id: "name-text" });
  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex();
  }, [saveHex]);

  return (
    <>
      <Text {...readableProps}>
        <FormattedMessage id="import-shared-url-description" />
      </Text>
      {timestamp !== undefined && (
        <Text {...readableProps}>
          <FormattedMessage
            id="open-project-setup-description"
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
          {...readableProps}
          aria-label={nameLabel}
          minW="25ch"
          value={name}
          placeholder={nameLabel}
          size="lg"
          onChange={(e) => setName(e.currentTarget.value)}
        />
      </Stack>
    </>
  );
};

interface StartSessionButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  onStartSession: () => void;
}

const StartSessionButton = ({
  isDisabled,
  isLoading,
  onStartSession,
}: StartSessionButtonProps) => (
  <HStack pt={5} justifyContent="flex-end">
    <ButtonWithLoading
      isDisabled={isDisabled}
      isLoading={isLoading}
      variant="primary"
      onClick={onStartSession}
      size="lg"
    >
      <FormattedMessage id="open-project-action" />
    </ButtonWithLoading>
  </HStack>
);

const previewFrame: HTMLChakraProps<"div"> = {
  borderWidth: 1,
  borderColor: "gray.300",
  backgroundColor: "gray.25",
  borderRadius: 15,
  overflowX: "scroll",
};

interface PreviewDataProps {
  dataset: ActionData[];
}

const PreviewData = ({ dataset }: PreviewDataProps) => {
  return (
    <>
      <Heading size="md" as="h2">
        <FormattedMessage id="import-shared-url-data-preview-title" />
      </Heading>
      <Text {...readableProps}>
        <FormattedMessage id="import-shared-url-data-preview-description" />
      </Text>
      <VStack
        justifyContent="start"
        flexGrow={1}
        alignItems="start"
        flexShrink={1}
        position="relative"
      >
        <Grid
          gridTemplateColumns="290px 1fr"
          gap={3}
          p={5}
          maxH="420px"
          w="full"
          overflow="auto"
          {...previewFrame}
          alignItems="start"
          autoRows="max-content"
          flexGrow={1}
        >
          {dataset.map((action) => (
            <DataSamplesTableRow
              readonly={true}
              key={action.ID}
              action={action}
              selected={false}
              showHints={false}
            />
          ))}
        </Grid>
      </VStack>
    </>
  );
};

interface MakeCodePreviewProps {
  project: MakeCodeProject;
}

const MakeCodePreview = ({ project }: MakeCodePreviewProps) => {
  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <Heading size="md" as="h2" pt={[1, 3, 5]}>
        <FormattedMessage id="import-shared-url-blocks-preview-title" />
      </Heading>
      <Text {...readableProps}>
        <FormattedMessage id="import-shared-url-blocks-preview-description" />
      </Text>
      <MakeCodeRenderBlocksProvider key={makeCodeLang} lang={makeCodeLang}>
        <VStack
          p={5}
          justifyContent="start"
          flexGrow={1}
          alignItems="start"
          overflowY="auto"
          flexShrink={1}
          {...previewFrame}
          ref={scrollableAreaRef}
        >
          <CodeViewCard parentRef={scrollableAreaRef} project={project} />
        </VStack>
      </MakeCodeRenderBlocksProvider>
    </>
  );
};

const ErrorPreloading = () => {
  const intl = useIntl();
  const titleText = intl.formatMessage({ id: "import-shared-url-error-title" });
  return (
    <ErrorPage title={titleText}>
      <VStack spacing={3}>
        <Stack>
          <Text {...readableProps}>
            <FormattedMessage id="import-shared-url-error-description" />
          </Text>
          <Text>
            <FormattedMessage
              id="support-request"
              values={{
                link: (chunks: ReactNode) => (
                  <Link
                    color="brand.600"
                    textDecoration="underline"
                    href="https://support.microbit.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </Link>
                ),
              }}
            />
          </Text>
          <Text>
            <Button variant="primary" onClick={() => window.location.reload()}>
              <FormattedMessage id="click-to-reload-page-action" />
            </Button>
          </Text>
        </Stack>
      </VStack>
    </ErrorPage>
  );
};

/**
 * This hook owns everything relating to preloading a project, except
 * for the name as that may be editable prior to loading. Instead let
 * it update the name on preload via a callback.
 */
const useProjectPreload = (setName: (name: string) => void) => {
  const { shortId } = useParams();
  const logging = useLogging();

  const [sharedState, setSharedState] = useState<SharedState>(SharedState.None);

  const [header, setHeader] = useState<Header>();
  const [projectText, setProjectText] = useState<ScriptText>();
  const [dataset, setDataset] = useState<ActionData[]>();

  useEffect(() => {
    if (!shortId) return;
    let cleanedUp = false;
    setSharedState(SharedState.GettingHeader);
    logging.event({
      type: "import-shared-project-start",
      detail: { shortId },
    });
    fetchSharedHeader(shortId)
      .then((header) => {
        if (cleanedUp) {
          throw new Error("Cancelled");
        }
        setSharedState(SharedState.GettingProject);
        setHeader(header);
        setName(header.name);
        return fetchSharedProjectText(header.id);
      })
      .then((text) => {
        if (cleanedUp) {
          throw new Error("Cancelled");
        }
        if (text["dataset.json"]) {
          // Do this first in case it errors on parse
          setDataset(
            (JSON.parse(text["dataset.json"]) as DatasetEditorJsonFormat).data
          );
        }
        setSharedState(SharedState.Complete);
        setProjectText(text);
        logging.event({
          type: "import-shared-project-preloaded",
          detail: { shortId },
        });
      })
      .catch((error: unknown) => {
        logging.event({
          type: "import-shared-project-failed",
          detail: { shortId, error },
        });
        if (!cleanedUp) {
          setSharedState(SharedState.Failed);
        }
      });
    return () => {
      cleanedUp = true;
    };
  }, [logging, shortId, setName]);
  return {
    sharedState,
    header,
    dataset,
    projectText,
    name,
  };
};

const fetchSharedHeader = async (shortId: string): Promise<Header> => {
  const headerResponse = await fetch(`https://www.makecode.com/api/${shortId}`);
  if (!headerResponse.ok) {
    throw new Error("Network errorr");
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
  if (!textResponse.ok) {
    throw new Error("Network errorr");
  }
  const text = (await textResponse.json()) as ScriptText;
  if (typeof text !== "object") {
    throw new Error("Error downloding project");
  }
  return text;
};

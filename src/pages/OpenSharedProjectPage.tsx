import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  HTMLChakraProps,
  Icon,
  Input,
  Link,
  SkeletonText,
  Stack,
  StackProps,
  Text,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import {
  MakeCodeBlocksRendering,
  MakeCodeRenderBlocksProvider,
} from "@microbit/makecode-embed";
import {
  BlockLayout,
  Header,
  MakeCodeProject,
  ScriptText,
} from "@microbit/makecode-embed/vanilla";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate, useParams } from "react-router";
import { ButtonWithLoading } from "../components/ButtonWithLoading";
import DataSamplesTableRow from "../components/DataSamplesTableRow";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingAnimation from "../components/LoadingAnimation";
import { useProject } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import { ActionData, DatasetEditorJsonFormat } from "../model";
import { getMakeCodeLang } from "../settings";
import { useSettings, useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

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
  my: [0, 0, 20],
  borderRadius: [0, "20px"],
  borderWidth: [null, null, 1],
  borderBottomWidth: 1,
  borderColor: [null, null, "gray.300"],
  p: 10,
  minW: [null, null, "xl"],
  alignItems: "stretch",
  width: ["full", "full", "3xl", "4xl"],
};

export const OpenSharedProjectPage = () => {
  const logging = useLogging();
  const navigate = useNavigate();
  const loadProject = useStore((s) => s.loadProject);
  const [name, setName] = useState("");
  const { sharedState, header, dataset, projectText } =
    useProjectPreload(setName);
  const { shortId } = useParams();

  const handleOpenProject = useCallback(() => {
    if (!header || !projectText) return;
    loadProject({ header: { ...header, name }, text: projectText }, name);
    logging.event({
      type: "import-shared-project-complete",
      detail: { shortId },
    });
    navigate(createDataSamplesPageUrl());
  }, [loadProject, header, projectText, name, navigate, logging, shortId]);

  if (sharedState === SharedState.Failed) {
    return <ErrorPreloading />;
  }

  if (sharedState < SharedState.GettingProject)
    return (
      <DefaultPageLayout
        titleId="open-shared-project-title"
        toolbarItemsRight={<HomeToolbarItem />}
        menuItems={<HomeMenuItem />}
      >
        <VStack
          as="main"
          justifyContent="center"
          m={[0, 5, 28]}
          aria-busy="true"
        >
          <VisuallyHidden>
            <Heading as="h1">
              <FormattedMessage id="open-shared-project-title" />
            </Heading>
            <Text>
              <FormattedMessage id="loading" />
            </Text>
          </VisuallyHidden>
          <LoadingAnimation />
        </VStack>
      </DefaultPageLayout>
    );

  return (
    <DefaultPageLayout
      titleId="open-shared-project-title"
      toolbarItemsRight={<HomeToolbarItem />}
      menuItems={<HomeMenuItem />}
    >
      <VStack as="main" justifyContent="center" paddingBottom={20}>
        <Stack {...contentStackProps} mb="5">
          <Heading as="h1" mb={5}>
            <FormattedMessage id="open-shared-project-title" />
          </Heading>
          {sharedState === SharedState.GettingHeader && <LoadingAnimation />}
          {sharedState >= SharedState.GettingProject && (
            <>
              <ProjectLoadDetails name={name} setName={setName} />
              {sharedState === SharedState.Complete && (
                <HStack gap={3}>
                  <Icon as={RiInformationLine} boxSize={6} alignSelf="start" />
                  <Text fontSize="md">
                    <FormattedMessage
                      id="third-party-content-description"
                      values={{
                        link: (children: ReactNode) => (
                          <Link
                            color="brand.600"
                            textDecoration="underline"
                            href={`https://makecode.microbit.org/${encodeURIComponent(
                              shortId!
                            )}`}
                          >
                            {children}
                          </Link>
                        ),
                      }}
                    />
                  </Text>
                </HStack>
              )}
              <OpenProjectButton
                onClick={handleOpenProject}
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
              <OpenProjectButton
                onClick={handleOpenProject}
                isDisabled={false}
                isLoading={false}
              />
            </>
          )}
        </Stack>
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
      <Text>
        <FormattedMessage id="open-shared-project-description" />
      </Text>
      {timestamp !== undefined && (
        <Text>
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
          aria-label={nameLabel}
          data-testid="name-text"
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

interface OpenProjectButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const OpenProjectButton = ({
  isDisabled,
  isLoading,
  onClick,
}: OpenProjectButtonProps) => (
  <HStack pt={5} justifyContent="flex-end">
    <ButtonWithLoading
      isDisabled={isDisabled}
      isLoading={isLoading}
      variant="primary"
      onClick={onClick}
      size="lg"
    >
      <FormattedMessage id="open-project-action" />
    </ButtonWithLoading>
  </HStack>
);

const previewFrameOuter: HTMLChakraProps<"div"> = {
  p: 2,
  bg: "whitesmoke",
  borderRadius: "sm",
};
const previewFrame: HTMLChakraProps<"div"> = {
  overflow: "auto",
  h: 96,
  minW: "100%",
};

interface PreviewDataProps {
  dataset: ActionData[];
}

const PreviewData = ({ dataset }: PreviewDataProps) => {
  return (
    <>
      <Heading size="md" as="h2">
        <FormattedMessage id="data-preview-title" />
      </Heading>
      <Text>
        <FormattedMessage id="open-shared-project-data-preview-description" />
      </Text>
      <Box {...previewFrameOuter}>
        <Box {...previewFrame}>
          <Grid gap={3} gridTemplateColumns="290px 1fr">
            {dataset.map((action) => (
              <DataSamplesTableRow
                preview={true}
                key={action.ID}
                action={action}
                selected={false}
                showHints={false}
              />
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
};

interface MakeCodePreviewProps {
  project: MakeCodeProject;
}

const MakeCodePreview = ({ project }: MakeCodePreviewProps) => {
  const [{ languageId }] = useSettings();
  const makeCodeLang = getMakeCodeLang(languageId);
  return (
    <>
      <Heading size="md" as="h2" pt={[1, 3, 5]}>
        <FormattedMessage id="blocks-preview-title" />
      </Heading>
      <Text>
        <FormattedMessage id="open-shared-project-blocks-preview-description" />
      </Text>
      <MakeCodeRenderBlocksProvider key={makeCodeLang} lang={makeCodeLang}>
        <Box
          {...previewFrameOuter}
          sx={{
            "> div": previewFrame,
            img: { maxWidth: "unset", height: "unset" },
          }}
        >
          <MakeCodeBlocksRendering
            code={project}
            layout={BlockLayout.Clean}
            loaderCmp={
              <SkeletonText
                w="xs"
                noOfLines={5}
                spacing="5"
                skeletonHeight="2"
              />
            }
          />
        </Box>
      </MakeCodeRenderBlocksProvider>
    </>
  );
};

const ErrorPreloading = () => {
  return (
    <VStack as="main" spacing={10} minH="100vh" w="100%" bgColor="whitesmoke">
      <Stack maxW="container.md" gap={5}>
        <Heading mt="33vh" as="h1">
          <FormattedMessage id="code-download-error" />
        </Heading>
        <Text>
          <FormattedMessage id="open-shared-project-error-description" />
        </Text>
        <Text>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <FormattedMessage id="click-to-reload-page-action" />
          </Button>
        </Text>
      </Stack>
    </VStack>
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

  const [sharedState, setSharedState] = useState<SharedState>(
    SharedState.GettingHeader
  );

  const [header, setHeader] = useState<Header>();
  const [projectText, setProjectText] = useState<ScriptText>();
  const [dataset, setDataset] = useState<ActionData[]>();

  useEffect(() => {
    if (!shortId) return;
    let cleanedUp = false;
    const loadAsync = async () => {
      try {
        logging.event({
          type: "import-shared-project-start",
          detail: { shortId },
        });
        const header = await fetchSharedHeader(shortId);
        if (cleanedUp) {
          throw new Error("Cancelled");
        }
        setSharedState(SharedState.GettingProject);
        setHeader(header);
        setName(header.name);
        const text = await fetchSharedProjectText(header.id);
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
      } catch (e: unknown) {
        logging.event({
          type: "import-shared-project-failed",
          detail: { shortId, error: e },
        });
        if (!cleanedUp) {
          setSharedState(SharedState.Failed);
        }
      }
    };
    void loadAsync();
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
  const headerResponse = await fetch(
    `https://www.makecode.com/api/${encodeURIComponent(shortId)}`
  );
  if (!headerResponse.ok) {
    throw new Error("Network error");
  }
  const header = (await headerResponse.json()) as Header;
  if (!header || !header.id || !header.name) {
    throw new Error("Incorrect header data");
  }
  return header;
};

const fetchSharedProjectText = async (longId: string): Promise<ScriptText> => {
  const textResponse = await fetch(
    `https://www.makecode.com/api/${encodeURIComponent(longId)}/text`
  );
  if (!textResponse.ok) {
    throw new Error("Network error");
  }
  const text = (await textResponse.json()) as ScriptText;
  if (typeof text !== "object") {
    throw new Error("Error downloding project");
  }
  return text;
};

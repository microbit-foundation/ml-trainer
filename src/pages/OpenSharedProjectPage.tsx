import {
  Button,
  Heading,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import { Header, ScriptText } from "@microbit/makecode-embed/vanilla";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { RiInformationLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { useNavigate, useParams } from "react-router";
import DefaultPageLayout, {
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingAnimation from "../components/LoadingAnimation";
import ProjectPreview from "../components/ProjectPreview";
import { useLogging } from "../logging/logging-hooks";
import { ActionData, DatasetEditorJsonFormat } from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";

const enum SharedState {
  GettingHeader,
  GettingProject,
  Complete,
  Failed,
}

const OpenSharedProjectPage = () => {
  const logging = useLogging();
  const navigate = useNavigate();
  const loadProject = useStore((s) => s.loadProject);
  const [name, setName] = useState("");
  const { sharedState, header, dataset, projectText } =
    useProjectPreload(setName);
  const { shareId } = useParams();

  const handleOpenProject = useCallback(async () => {
    if (!header || !projectText) return;
    await loadProject({ header: { ...header, name }, text: projectText }, name);
    logging.event({
      type: "import-shared-project-complete",
      detail: { shareId },
    });
    navigate(createDataSamplesPageUrl());
  }, [loadProject, header, projectText, name, navigate, logging, shareId]);

  if (sharedState === SharedState.Failed) {
    return <ErrorPreloading />;
  }

  return (
    <DefaultPageLayout
      titleId="open-shared-project-title"
      toolbarItemsRight={<HomeToolbarItem />}
      backUrl={createHomePageUrl()}
    >
      {sharedState === SharedState.GettingHeader ? (
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
      ) : (
        <ProjectPreview
          dataset={dataset}
          descriptionTextId="open-shared-project-description"
          isLoading={sharedState === SharedState.GettingProject}
          onOpenProject={handleOpenProject}
          project={{
            header,
            text: projectText,
          }}
          projectName={name}
          setProjectName={setName}
          sourceInfo={
            sharedState === SharedState.Complete && (
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
                            shareId!
                          )}`}
                        >
                          {children}
                        </Link>
                      ),
                    }}
                  />
                </Text>
              </HStack>
            )
          }
          titleId="open-shared-project-title"
        />
      )}
    </DefaultPageLayout>
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
  const { shareId } = useParams();
  const logging = useLogging();

  const [sharedState, setSharedState] = useState<SharedState>(
    SharedState.GettingHeader
  );

  const [header, setHeader] = useState<Header>();
  const [projectText, setProjectText] = useState<ScriptText>();
  const [dataset, setDataset] = useState<ActionData[]>();

  useEffect(() => {
    if (!shareId) return;
    let cleanedUp = false;
    const loadAsync = async () => {
      try {
        logging.event({
          type: "import-shared-project-start",
          detail: { shareId },
        });
        const header = await fetchSharedHeader(shareId);
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
          detail: { shareId },
        });
      } catch (e: unknown) {
        logging.event({
          type: "import-shared-project-failed",
          detail: { shareId, error: e },
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
  }, [logging, shareId, setName]);
  return {
    sharedState,
    header,
    dataset,
    projectText,
    name,
  };
};

const fetchSharedHeader = async (shareId: string): Promise<Header> => {
  const headerResponse = await fetch(
    `https://www.makecode.com/api/${encodeURIComponent(shareId)}`
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

export default OpenSharedProjectPage;

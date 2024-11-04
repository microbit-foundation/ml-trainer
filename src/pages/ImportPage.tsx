import {
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Project } from "@microbit/makecode-embed/react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { useDeployment } from "../deployment";
import { useProject } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import { MicrobitOrgResource } from "../model";
import { defaultProjectName, validateProjectName } from "../project-name";
import { useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

const ImportPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { activitiesBaseUrl } = useDeployment();
  const [params] = useSearchParams();
  const [name, setName] = useState<string>(defaultProjectName);
  const isValidSetup = validateProjectName(name);
  const [fetchingProject, setFetchingProject] = useState<boolean>(true);
  const [project, setProject] = useState<Project>();
  const logging = useLogging();

  useEffect(() => {
    const updateAsync = async () => {
      const resourceId = params.get("id");
      const resourceProject = params.get("project");
      const resourceName = params.get("name");
      const resource =
        resourceId && resourceProject && resourceName
          ? { id: resourceId, project: resourceProject, name: resourceName }
          : undefined;
      if (!resource || !activitiesBaseUrl) {
        return;
      }
      try {
        const project = await fetchMicrobitOrgResourceProjectCode(
          activitiesBaseUrl,
          resource,
          intl
        );
        setProject(project);
        setName(resourceName ?? defaultProjectName);
      } catch (e) {
        // Log the fetch error, but fallback to new blank session by default.
        logging.error(e);
      }
    };
    void updateAsync().then(() => {
      setFetchingProject(false);
    });
  }, [activitiesBaseUrl, intl, logging, params]);

  const loadProject = useStore((s) => s.loadProject);
  const newSession = useStore((s) => s.newSession);
  const timestamp = useStore((s) => s.timestamp);

  const handleStartSession = useCallback(() => {
    if (project) {
      loadProject(project, name);
      navigate(createDataSamplesPageUrl());
    } else {
      // If no resource fetched, start as new empty session
      // with provided project name
      newSession(name);
      navigate(createDataSamplesPageUrl());
    }
  }, [loadProject, name, navigate, newSession, project]);

  const { saveHex } = useProject();
  const handleSave = useCallback(() => {
    void saveHex();
  }, [saveHex]);

  const nameLabel = intl.formatMessage({ id: "name-text" });
  return (
    <DefaultPageLayout
      titleId="new-session-setup-title"
      toolbarItemsRight={<HomeToolbarItem />}
      menuItems={<HomeMenuItem />}
    >
      <VStack justifyContent="center">
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
            <FormattedMessage id="new-session-setup-title" />
          </Heading>
          {timestamp !== undefined && (
            <Text>
              <FormattedMessage
                id="new-session-setup-description"
                values={{
                  link: (chunks: ReactNode) => (
                    <Button onClick={handleSave} variant="link">
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
              aria-labelledby={nameLabel}
              minW="25ch"
              value={name}
              name={nameLabel}
              placeholder={nameLabel}
              size="lg"
              onChange={(e) => setName(e.currentTarget.value)}
            />
          </Stack>
          <HStack pt={5} justifyContent="flex-end">
            <Button
              isDisabled={!isValidSetup}
              isLoading={fetchingProject}
              variant="primary"
              onClick={handleStartSession}
              size="lg"
            >
              <FormattedMessage id="start-session-action" />
            </Button>
          </HStack>
        </Stack>
      </VStack>
    </DefaultPageLayout>
  );
};

const isValidProject = (content: Project): content is Project => {
  return (
    content &&
    typeof content === "object" &&
    "text" in content &&
    !!content.text
  );
};

const fetchMicrobitOrgResourceProjectCode = async (
  activitiesBaseUrl: string,
  resource: MicrobitOrgResource,
  intl: IntlShape
): Promise<Project> => {
  const url = `${activitiesBaseUrl}${encodeURIComponent(
    resource.id
  )}-makecode.json`;
  let json;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unexpected response ${response.status}`);
    }
    json = (await response.json()) as object;
  } catch (e) {
    const rethrow = new Error(
      intl.formatMessage({ id: "code-download-error" })
    );
    rethrow.stack = e instanceof Error ? e.stack : undefined;
    throw rethrow;
  }
  if (
    !("editorContent" in json) ||
    typeof json.editorContent !== "object" ||
    !json.editorContent ||
    !isValidProject(json.editorContent)
  ) {
    throw new Error(intl.formatMessage({ id: "code-format-error" }));
  }
  return json.editorContent;
};

export default ImportPage;

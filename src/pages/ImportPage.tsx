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
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { useDeployment } from "../deployment";
import { useProject } from "../hooks/project-hooks";
import { MicrobitOrgResource } from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";
import { useConnectionStage } from "../connection-stage-hooks";

const ImportPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { activitiesBaseUrl } = useDeployment();
  const resource = useMicrobitResourceSearchParams();
  const code = useRef<Project>();
  const [name, setName] = useState<string>("Untitled");
  const isValidSetup = name.trim().length > 0;

  useEffect(() => {
    const updateAsync = async () => {
      if (!resource || !activitiesBaseUrl) {
        return;
      }
      code.current = await fetchMicrobitOrgResourceTargetCode(
        activitiesBaseUrl,
        resource,
        intl
      );
      setName(code.current.header?.name ?? "Untitled");
    };
    void updateAsync();
  }, [activitiesBaseUrl, intl, resource]);

  const loadProject = useStore((s) => s.loadProject);
  const newSession = useStore((s) => s.newSession);
  const { actions: connStageActions } = useConnectionStage();

  const handleStartSession = useCallback(() => {
    if (code.current) {
      loadProject(code.current, name);
      navigate(createDataSamplesPageUrl());
    } else {
      // If no resource fetched, start as new empty session.
      newSession();
      navigate(createDataSamplesPageUrl());
      connStageActions.startConnect();
    }
  }, [connStageActions, loadProject, name, navigate, newSession]);

  const handleBack = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);

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
          <HStack pt={5} justifyContent="space-between">
            <Button variant="ghost" onClick={handleBack} size="lg">
              <FormattedMessage id="back-action" />
            </Button>
            <Button
              isDisabled={!isValidSetup}
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

const useMicrobitResourceSearchParams = (): MicrobitOrgResource | undefined => {
  const [params] = useSearchParams();
  const id = params.get("id");
  const project = params.get("project");
  const name = params.get("name");
  return id && name && project ? { id, project, name } : undefined;
};

const isValidProject = (content: Project): content is Project => {
  return (
    content &&
    typeof content === "object" &&
    "text" in content &&
    !!content.text
  );
};

const fetchMicrobitOrgResourceTargetCode = async (
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

import {
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { Project } from "@microbit/makecode-embed/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import DefaultPageLayout from "../components/DefaultPageLayout";
import InlineForm from "../components/InlineForm";
import { useDeployment } from "../deployment";
import { MicrobitOrgResource } from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createNewPageUrl } from "../urls";

const ImportPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const { activitiesBaseUrl } = useDeployment();
  const resource = useMicrobitResourceSearchParams();
  const code = useRef<Project>();
  const loadProject = useStore((s) => s.loadProject);
  const [name, setName] = useState<string>("Untitled");

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
      navigate(createDataSamplesPageUrl());
    };
    void updateAsync();
  }, [activitiesBaseUrl, intl, loadProject, navigate, resource]);

  const isValidSetup = name.trim().length > 0;

  const nameLabel = intl.formatMessage({ id: "name-label" });

  const handleBack = useCallback(() => {
    navigate(createNewPageUrl());
  }, [navigate]);

  const handleStartSession = useCallback(() => {
    if (!code.current) {
      throw new Error("No imported project found");
    }
    loadProject(code.current, name);
  }, [loadProject, name]);

  return (
    <DefaultPageLayout titleId="new-session-setup-title">
      <VStack justifyContent="center">
        <InlineForm width={["unset", "unset", "2xl", "2xl"]} maxW="2xl">
          <Heading as="h1" mb={5}>
            <FormattedMessage id="new-session-setup-title" />
          </Heading>
          <Stack py={2} spacing={5}>
            <Heading size="md" as="h2">
              <FormattedMessage id="name-label" />
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
        </InlineForm>
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

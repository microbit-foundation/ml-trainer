import { Project } from "@microbit/makecode-embed/react";
import { useEffect } from "react";
import { IntlShape, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { useDeployment } from "../deployment";
import { MicrobitOrgResource } from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl } from "../urls";

const ImportPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const { activitiesBaseUrl } = useDeployment();
  const resource = useMicrobitResourceSearchParams();
  const loadProject = useStore((s) => s.loadProject);
  console.log("resource", resource);

  useEffect(() => {
    const updateAsync = async () => {
      if (!resource || !activitiesBaseUrl) {
        return;
      }
      const code = await fetchMicrobitOrgResourceTargetCode(
        activitiesBaseUrl,
        resource,
        intl
      );
      console.log("code", code);
      loadProject(code);
      navigate(createDataSamplesPageUrl());
    };
    void updateAsync();
  }, [activitiesBaseUrl, intl, loadProject, navigate, resource]);

  return <></>;
};

const useMicrobitResourceSearchParams = (): MicrobitOrgResource | undefined => {
  const [params] = useSearchParams();
  const id = params.get("id");
  const project = params.get("project");
  const name = params.get("name");

  return id && name && project ? { id, project, name } : undefined;
};

const isValidEditorContent = (content: Project): content is Project => {
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
  const url = `${activitiesBaseUrl}${resource.id}-makecode.json`;
  let json;
  try {
    const response = await fetch(url);
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
    !isValidEditorContent(json.editorContent)
  ) {
    throw new Error(intl.formatMessage({ id: "code-format-error" }));
  }
  return json.editorContent;
};

export default ImportPage;

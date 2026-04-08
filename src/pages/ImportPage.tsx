/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import { useCallback, useEffect, useState } from "react";
import { IntlShape, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import DefaultPageLayout, {
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import ProjectPreview from "../components/ProjectPreview";
import { useDeployment } from "../deployment";
import { setEditorVersionOverride } from "../editor-version";
import { useDefaultProjectName } from "../hooks/project-hooks";
import { useLogging } from "../logging/logging-hooks";
import {
  ActionData,
  DatasetEditorJsonFormat,
  MicrobitOrgResource,
} from "../model";
import { useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";
import { migrateLegacyActionDataAndAssignNewIds } from "../project-utils";

const ImportPage = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { activitiesBaseUrl } = useDeployment();
  const [params] = useSearchParams();
  setEditorVersionOverride(params.get("editorVersion") || undefined);
  const defaultProjectName = useDefaultProjectName();
  const [name, setName] = useState<string>(
    params.get("name") ?? defaultProjectName
  );
  const [fetchingProject, setFetchingProject] = useState<boolean>(true);
  const [project, setProject] = useState<MakeCodeProject>();
  const [dataset, setDataset] = useState<ActionData[]>();
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
        if (project.text?.["dataset.json"]) {
          // Do this first in case it errors on parse
          const actionData = migrateLegacyActionDataAndAssignNewIds(
            (
              JSON.parse(
                project.text["dataset.json"]
              ) as DatasetEditorJsonFormat
            ).data
          );
          setDataset(actionData);
        }
        setProject(project);
      } catch (e) {
        // Log the fetch error, but fallback to new blank session by default.
        logging.error("Failed to fetch project", e);
      }
    };
    void updateAsync().then(() => {
      setFetchingProject(false);
    });
  }, [activitiesBaseUrl, intl, logging, params]);

  const loadProject = useStore((s) => s.loadProject);
  const newSession = useStore((s) => s.newSession);

  const handleOpenProject = useCallback(async () => {
    if (project) {
      await loadProject(project, name);
      navigate(createDataSamplesPageUrl());
    } else {
      // If no resource fetched, start as new empty session
      // with provided project name
      await newSession(name);
      navigate(createDataSamplesPageUrl());
    }
  }, [loadProject, name, navigate, newSession, project]);

  return (
    <DefaultPageLayout
      titleId="new-project-setup-title"
      toolbarItemsRight={<HomeToolbarItem />}
      backUrl={createHomePageUrl()}
    >
      <ProjectPreview
        dataset={dataset}
        isLoading={fetchingProject}
        onOpenProject={handleOpenProject}
        project={project}
        projectName={name}
        setProjectName={setName}
        titleId="new-project-setup-title"
      />
    </DefaultPageLayout>
  );
};

const isValidProject = (
  content: MakeCodeProject
): content is MakeCodeProject => {
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
): Promise<MakeCodeProject> => {
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

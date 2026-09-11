/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  css,
  cx,
  Flex,
  Grid,
  HStack,
  Slide,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from "@microbit/ui";
import {
  defaultSortDirection,
  ProjectCard,
  ProjectSortField,
  ProjectsToolbar,
  rankProjects,
  SearchInput,
  SortDirection,
  SortInput,
  sortProjects,
  useProjectActions,
  useProjectSelection,
} from "@microbit/ui-patterns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router";
import DefaultPageLayout, {
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import ProjectIcon from "../components/ProjectIcon";
import { useLogging } from "../logging/logging-hooks";
import { ProjectDataWithActions } from "../storage";
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";

const actionNames = (project: ProjectDataWithActions) =>
  project.actions.map((a) => a.name);

const ProjectsPage = () => {
  const navigate = useNavigate();
  const allProjectData = useStore((s) => s.allProjectData);
  const renameProject = useStore((s) => s.setProjectName);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const deleteProjects = useStore((s) => s.deleteProjects);
  const logging = useLogging();
  const mobileIconOnly = useBreakpointValue({ base: true, md: false });

  const selection = useProjectSelection(allProjectData);
  const { selectedIds } = selection;

  const [field, setField] = useState<ProjectSortField>("timestamp");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const handleFieldChange = (next: ProjectSortField) => {
    const nextDirection = defaultSortDirection(next);
    setDirection(nextDirection);
    setField(next);
    logging.event({
      type: "project_sort",
      detail: { field: next, direction: nextDirection },
    });
  };
  const toggleDirection = () => {
    setDirection((prev) => {
      const next = prev === "asc" ? "desc" : "asc";
      logging.event({
        type: "project_sort",
        detail: { field, direction: next },
      });
      return next;
    });
  };

  const handleOpenProject = useCallback(
    async (id: string) => {
      logging.event({
        type: "project_open",
        detail: { surface: "projects" },
      });
      await loadProjectAndModelFromStorage(id);
      void navigate(createDataSamplesPageUrl());
    },
    [logging, navigate]
  );

  const actions = useProjectActions({
    projects: allProjectData,
    getSelectedIds: () => selectedIds,
    onRename: async (id, name) => {
      logging.event({
        type: "project_rename",
        detail: { surface: "projects" },
      });
      await renameProject(name, id);
    },
    onDuplicate: async (id, name) => {
      logging.event({
        type: "project_duplicate",
        detail: { surface: "projects" },
      });
      await duplicateProject(id, name);
    },
    onDelete: async (ids) => {
      logging.event({
        type: "project_delete",
        detail: { surface: "projects", count: ids.length },
      });
      await deleteProjects(ids);
    },
  });

  const desktopToolbarRef = useRef<HTMLDivElement>(null);
  const mobileToolbarRef = useRef<HTMLDivElement>(null);
  const handleSkipToToolbar = useCallback(() => {
    const toolbar = desktopToolbarRef.current?.offsetParent
      ? desktopToolbarRef.current
      : mobileToolbarRef.current;
    toolbar?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  const [query, setQuery] = useState("");
  const handleQueryChange = useCallback(
    (value: string) => {
      if (value.trim()) {
        selection.clear();
      }
      setQuery(value);
    },
    [selection]
  );

  // Debounced project_search log: emit one event per intentional search,
  // not per keystroke. The trailing 400ms idle window is long enough that
  // a user typing "rps" doesn't fire three searches in dashboards.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const handle = setTimeout(() => {
      logging.event({ type: "project_search" });
    }, 400);
    return () => clearTimeout(handle);
  }, [logging, query]);

  const processedProjects = useMemo(
    () =>
      query.trim()
        ? rankProjects(allProjectData, query, actionNames)
        : sortProjects(allProjectData, field, direction),
    [allProjectData, direction, field, query]
  );

  return (
    <>
      {actions.dialogs}
      <DefaultPageLayout
        titleId="projects-page-title"
        showPageTitle
        toolbarItemsRight={<HomeToolbarItem />}
        backUrl={createHomePageUrl()}
        backLabelId="home-action"
      >
        <VStack as="main" alignItems="center" flexGrow={1}>
          <Box
            w="100%"
            mx="auto"
            maxW="1180px"
            alignItems="stretch"
            p={4}
            mt={4}
            display="flex"
            flexDir="column"
            flexGrow={1}
          >
            <HStack mb={4} justifyContent="space-between" alignItems="center">
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                className={css({ maxW: "30ch", my: "1px" })}
              />
              {selection.hasSelection && (
                <Box
                  ref={desktopToolbarRef}
                  display={{ base: "none", lg: "block" }}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  marginLeft="auto"
                >
                  <ProjectsToolbar
                    selectedCount={selectedIds.length}
                    onDelete={actions.requestDelete}
                    onRename={actions.rename}
                    onDuplicate={actions.duplicate}
                    onClearSelection={selection.clear}
                  />
                </Box>
              )}
              <SortInput
                className={cx(
                  css({ marginLeft: "auto" }),
                  selection.hasSelection
                    ? css({ display: { base: "flex", lg: "none" } })
                    : undefined
                )}
                field={field}
                onFieldChange={handleFieldChange}
                direction={direction}
                onToggleDirection={toggleDirection}
                hasSearchQuery={!!query}
              />
            </HStack>
            {processedProjects.length > 0 ? (
              <Grid
                mt={3}
                gap={3}
                gridTemplateColumns={{
                  base: "repeat(1, minmax(0, 1fr))",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                }}
                pb={selection.hasSelection ? { base: 16, lg: 0 } : 0}
              >
                {processedProjects.map((projectData) => (
                  <ProjectCard
                    key={projectData.id}
                    project={projectData}
                    description={actionNames(projectData).join(", ")}
                    isSelected={selection.isSelected(projectData.id)}
                    onSelected={selection.toggle}
                    onDelete={actions.requestDelete}
                    onRename={actions.rename}
                    onDuplicate={actions.duplicate}
                    onOpen={handleOpenProject}
                    onSkipToToolbar={handleSkipToToolbar}
                  >
                    <ProjectIcon hasCheckbox />
                  </ProjectCard>
                ))}
              </Grid>
            ) : (
              <Stack
                justifyContent="center"
                alignItems="center"
                flexGrow={1}
                p={12}
              >
                <Text>
                  <FormattedMessage id="no-projects" />
                </Text>
              </Stack>
            )}
          </Box>
        </VStack>
      </DefaultPageLayout>
      <Slide isOpen={selection.hasSelection} css={{ zIndex: 10 }}>
        <Flex
          justifyContent="center"
          display={{ base: "flex", lg: "none" }}
          ref={mobileToolbarRef}
          bg="white"
          boxShadow="0 -2px 8px rgba(0,0,0,0.1)"
          borderTop="1px solid"
          borderColor="gray.200"
          py={2}
          px={4}
        >
          <ProjectsToolbar
            selectedCount={selection.lastSelectedIds.length}
            onDelete={actions.requestDelete}
            onRename={actions.rename}
            onDuplicate={actions.duplicate}
            onClearSelection={selection.clear}
            isAttached={false}
            iconOnly={mobileIconOnly}
            size="lg"
          />
        </Flex>
      </Slide>
    </>
  );
};

export default ProjectsPage;

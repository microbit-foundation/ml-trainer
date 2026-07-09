import orderBy from "lodash.orderby";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { ConfirmDialog } from "../components/ConfirmDialog";
import DefaultPageLayout, {
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { NameProjectDialog } from "../components/NameProjectDialog";
import ProjectCard from "../components/ProjectCard";
import ProjectsToolbar from "../components/ProjectsToolbar";
import Search from "../components/Search";
import SortInput from "../components/SortInput";
import { useProjectCardActions } from "../hooks/use-project-card-actions";
import { useLogging } from "../logging/logging-hooks";
import {
  Box,
  css,
  cx,
  Flex,
  Grid,
  HStack,
  Stack,
  Text,
  useBreakpointValue,
  VStack,
} from "../shared-ui";
import { ProjectDataWithActions } from "../storage";
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";

type OrderByField = "timestamp" | "name";

interface RankedProject extends ProjectDataWithActions {
  score: number;
}

const ProjectsPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const allProjectData = useStore((s) => s.allProjectData);
  const deleteProjects = useStore((s) => s.deleteProjects);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const mobileIconOnly = useBreakpointValue({ base: true, md: false });
  const logging = useLogging();

  useEffect(() => {
    const projectIds = new Set(allProjectData.map((p) => p.id));
    setSelectedProjectIds((prev) => prev.filter((id) => projectIds.has(id)));
  }, [allProjectData]);

  const [orderByField, setOrderByField] = useState<OrderByField>("timestamp");
  const [orderByDirection, setOrderByDirection] = useState<"asc" | "desc">(
    "desc"
  );
  const handleOrderByFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as OrderByField;
    const direction = value === "name" ? "asc" : "desc";
    setOrderByDirection(direction);
    setOrderByField(value);
    logging.event({
      type: "project_sort",
      detail: { field: value, direction },
    });
  };
  const toggleOrderByDirection = () => {
    setOrderByDirection((prev) => {
      const next = prev === "asc" ? "desc" : "asc";
      logging.event({
        type: "project_sort",
        detail: { field: orderByField, direction: next },
      });
      return next;
    });
  };

  const handleOpenProject = useCallback(
    async (id?: string) => {
      logging.event({
        type: "project_open",
        detail: { surface: "projects" },
      });
      await loadProjectAndModelFromStorage(id ?? selectedProjectIds[0]);
      navigate(createDataSamplesPageUrl());
    },
    [logging, navigate, selectedProjectIds]
  );

  const {
    projectName,
    projectNameReason,
    nameDialogIsOpen,
    confirmDialogIsOpen,
    finalFocusRef,
    setFinalFocusRef,
    clearFinalFocusRef,
    handleOpenNameProjectDialog,
    handleNameProjectDialogClose,
    handleNameProjectSave,
    handleOpenConfirmDialog,
    handleCloseConfirmDialog,
    handleDeleteProject,
  } = useProjectCardActions({
    surface: "projects",
    getSelectedProjectId: () =>
      selectedProjectIds.length === 1 ? selectedProjectIds[0] : undefined,
    getSelectedProjectIds: () => selectedProjectIds,
    onDeleteSelected: () => deleteProjects(selectedProjectIds),
  });

  const updateSelectedProjects = useCallback((id: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProjectIds([]);
  }, []);

  const hasSelection = selectedProjectIds.length > 0;
  const lastSelectionRef = useRef(selectedProjectIds);
  if (hasSelection) {
    lastSelectionRef.current = selectedProjectIds;
  }

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) {
        setSelectedProjectIds([]);
      }
      setQuery(e.target.value);
    },
    []
  );

  const handleQueryClear = useCallback(() => {
    setQuery("");
  }, []);

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

  const getSearchResults = useCallback(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery.split(/\s+/);

    const rankedProjects: RankedProject[] = allProjectData
      .map((project) => {
        let score = 0;
        const normalizedTitle = project.name.toLowerCase();
        const normalizedActions = project.actions.map((action) =>
          action.name.toLowerCase()
        );

        // Check if all query terms match somewhere in the project.
        const allTermsMatch = queryTerms.every((term) => {
          const titleMatches = normalizedTitle.includes(term);
          const actionMatches = normalizedActions.some((action) =>
            action.includes(term)
          );
          return titleMatches || actionMatches;
        });

        // If not all terms match, exclude this project.
        if (!allTermsMatch) {
          return { ...project, score: 0 };
        }

        // Score for title matches (higher weight).
        queryTerms.forEach((term) => {
          // Exact title match - highest score.
          if (normalizedTitle === term) {
            score += 100;
          }
          // Title starts with term - high score.
          else if (normalizedTitle.startsWith(term)) {
            score += 50;
          }
          // Title contains term - good score.
          else if (normalizedTitle.includes(term)) {
            score += 30;
          }
        });

        // Score for action matches (lower weight).
        normalizedActions.forEach((action) => {
          queryTerms.forEach((term) => {
            // Exact action match
            if (action === term) {
              score += 15;
            }
            // Action starts with term.
            else if (action.startsWith(term)) {
              score += 8;
            }
            // Action contains term.
            else if (action.includes(term)) {
              score += 5;
            }
          });
        });

        return { ...project, score };
      })
      .filter((project) => project.score > 0)
      .sort((a, b) => b.score - a.score);

    return rankedProjects.map(({ score: _, ...project }) => project);
  }, [allProjectData, query]);

  const processedProjects = useMemo((): ProjectDataWithActions[] => {
    if (query.trim()) {
      return getSearchResults();
    }
    return orderBy(
      allProjectData,
      orderByField === "name" ? (p) => p.name.toLowerCase() : orderByField,
      orderByDirection
    );
  }, [allProjectData, getSearchResults, orderByDirection, orderByField, query]);

  return (
    <>
      <NameProjectDialog
        projectName={projectName}
        isOpen={nameDialogIsOpen}
        onClose={handleNameProjectDialogClose}
        onCloseComplete={clearFinalFocusRef}
        onSave={handleNameProjectSave}
        finalFocusRef={finalFocusRef}
        heading={
          <FormattedMessage
            id={
              projectNameReason === "rename"
                ? "rename-project-heading"
                : "duplicate-project-heading"
            }
          />
        }
        helperText={null}
        confirmText={
          <FormattedMessage
            id={
              projectNameReason === "rename"
                ? "rename-project-action"
                : "duplicate-project-action"
            }
          />
        }
      />
      <ConfirmDialog
        isOpen={confirmDialogIsOpen}
        heading={intl.formatMessage({
          id: projectName
            ? "delete-project-confirm-heading"
            : "delete-projects-confirm-heading",
        })}
        body={
          <Text>
            {projectName ? (
              <FormattedMessage
                id="delete-project-confirm-text"
                values={{ project: projectName }}
              />
            ) : (
              <FormattedMessage
                id="delete-projects-confirm-text"
                values={{ numProjects: selectedProjectIds.length }}
              />
            )}
          </Text>
        }
        onConfirm={() => handleDeleteProject()}
        onCancel={handleCloseConfirmDialog}
        onCloseComplete={clearFinalFocusRef}
        finalFocusRef={finalFocusRef}
      />
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
              <Search
                query={query}
                onChange={handleQueryChange}
                onClear={handleQueryClear}
                className={css({ maxW: "30ch", my: "1px" })}
              />
              {hasSelection && (
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
                    selectedProjectIds={selectedProjectIds}
                    onDeleteProject={handleOpenConfirmDialog}
                    onRenameDuplicateProject={handleOpenNameProjectDialog}
                    onClearSelection={clearSelection}
                  />
                </Box>
              )}
              <SortInput
                className={cx(
                  css({ marginLeft: "auto" }),
                  hasSelection
                    ? css({ display: { base: "flex", lg: "none" } })
                    : undefined
                )}
                value={orderByField}
                onSelectChange={handleOrderByFieldChange}
                order={orderByDirection}
                toggleOrder={toggleOrderByDirection}
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
                pb={hasSelection ? { base: 16, lg: 0 } : 0}
              >
                {processedProjects.map((projectData) => (
                  <ProjectCard
                    key={projectData.id}
                    projectData={projectData}
                    isSelected={selectedProjectIds.includes(projectData.id)}
                    onSelected={updateSelectedProjects}
                    onDeleteProject={handleOpenConfirmDialog}
                    onRenameDuplicateProject={handleOpenNameProjectDialog}
                    onOpenProject={handleOpenProject}
                    setFinalFocusRef={setFinalFocusRef}
                    onSkipToToolbar={handleSkipToToolbar}
                  />
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
      {/* Chakra Slide equivalent: fixed bottom sheet, translated offscreen
          when there is no selection. */}
      <div
        className={cx(
          css({
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            transitionProperty: "transform",
            transitionDuration: "0.25s",
            transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }),
          hasSelection
            ? css({ transform: "translateY(0)" })
            : css({ transform: "translateY(100%)" })
        )}
      >
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
            selectedProjectIds={lastSelectionRef.current}
            onDeleteProject={handleOpenConfirmDialog}
            onRenameDuplicateProject={handleOpenNameProjectDialog}
            onClearSelection={clearSelection}
            isAttached={false}
            iconOnly={mobileIconOnly}
            size="lg"
          />
        </Flex>
      </div>
    </>
  );
};

export default ProjectsPage;

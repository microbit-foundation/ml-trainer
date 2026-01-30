import {
  Box,
  Button,
  Container,
  HStack,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import orderBy from "lodash.orderby";
import { RefObject, Suspense, useCallback, useMemo, useState } from "react";
import { Await, useLoaderData, useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingPage from "../components/LoadingPage";
import { NameProjectDialog } from "../components/NameProjectDialog";
import ProjectCard from "../components/ProjectCard";
import ProjectCardActions from "../components/ProjectCardActions";
import ProjectsToolbar from "../components/ProjectsToolbar";
import Search from "../components/Search";
import SortInput from "../components/SortInput";
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";
import { ProjectDataWithActions } from "../storage";

type OrderByField = "timestamp" | "name";

interface RankedProject extends ProjectDataWithActions {
  score: number;
}

const ProjectsPage = () => {
  const { allProjectDataLoaded } = useLoaderData() as {
    allProjectDataLoaded: boolean;
  };
  const navigate = useNavigate();
  const allProjectData = useStore((s) => s.allProjectData);
  const renameProject = useStore((s) => s.renameProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const deleteProjects = useStore((s) => s.deleteProjects);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectToRename, setProjectToRename] = useState<string | null>(null);

  const navigateToHomePage = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);

  const [orderByField, setOrderByField] = useState<OrderByField>("timestamp");
  const handleOrderByFieldChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as OrderByField;
    if (value === "name") {
      setOrderByDirection("asc");
    } else {
      setOrderByDirection("desc");
    }
    setOrderByField(value);
  };
  const toggleOrderByDirection = () => {
    setOrderByDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };
  const [orderByDirection, setOrderByDirection] = useState<"asc" | "desc">(
    "desc"
  );

  const handleOpenProject = useCallback(
    async (id?: string) => {
      await loadProjectAndModelFromStorage(id ?? selectedProjectIds[0]);
      navigate(createDataSamplesPageUrl());
    },
    [navigate, selectedProjectIds]
  );

  const handleDeleteProject = useCallback(
    async (id?: string) => {
      if (id) {
        return deleteProject(id);
      }
      if (selectedProjectIds.length === 1) {
        return deleteProject(selectedProjectIds[0]);
      }
      await deleteProjects(selectedProjectIds);
    },
    [deleteProject, deleteProjects, selectedProjectIds]
  );

  const updateSelectedProjects = useCallback((id: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  }, []);

  const [nameDialogIsOpen, setNameDialogIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const handleOpenNameProjectDialog = useCallback(
    (id?: string) => {
      const projectId = id ?? selectedProjectIds[0];
      const project = allProjectData.find((p) => p.id === projectId);
      if (project) {
        setProjectName(project.name);
        setNameDialogIsOpen(true);
        setProjectToRename(project.id);
      }
    },
    [allProjectData, selectedProjectIds]
  );

  const handleNameProjectDialogClose = useCallback(() => {
    setNameDialogIsOpen(false);
    setProjectToRename(null);
  }, []);

  const handleNameProjectDialogCloseComplete = useCallback(() => {
    setFinalFocusRef(undefined);
  }, []);

  const handleRenameProject = useCallback(
    async (name: string | undefined) => {
      if (projectToRename) {
        await renameProject(projectToRename, name ?? "");
      }
      handleNameProjectDialogClose();
    },
    [handleNameProjectDialogClose, projectToRename, renameProject]
  );

  const [query, setQuery] = useState("");
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleQueryClear = useCallback(() => {
    setQuery("");
  }, []);

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
    if (query) {
      return getSearchResults();
    }
    return orderBy(
      allProjectData.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
      orderByField === "name" ? (p) => p.name.toLowerCase() : orderByField,
      orderByDirection
    );
  }, [allProjectData, getSearchResults, orderByDirection, orderByField, query]);

  const [finalFocusRef, setFinalFocusRef] = useState<
    RefObject<HTMLElement> | undefined
  >();

  return (
    <Suspense fallback={<LoadingPage />}>
      <Await resolve={allProjectDataLoaded}>
        <NameProjectDialog
          projectName={projectName}
          isOpen={nameDialogIsOpen}
          onClose={handleNameProjectDialogClose}
          onCloseComplete={handleNameProjectDialogCloseComplete}
          onSave={handleRenameProject}
          finalFocusRef={finalFocusRef}
        />
        <DefaultPageLayout
          toolbarItemsRight={<HomeToolbarItem />}
          menuItems={<HomeMenuItem />}
          toolbarItemsLeft={
            <Button
              leftIcon={<BackArrow />}
              variant="toolbar"
              onClick={navigateToHomePage}
            >
              Home page
            </Button>
          }
        >
          <VStack as="main" alignItems="center">
            <Container maxW="1180px" alignItems="stretch" p={4} mt={4}>
              <Box mb={8} maxW={["100%", null, "600px"]}>
                <Search
                  query={query}
                  onChange={handleQueryChange}
                  onClear={handleQueryClear}
                />
              </Box>
              <HStack>
                <ProjectsToolbar
                  selectedProjectIds={selectedProjectIds}
                  onDeleteProject={handleDeleteProject}
                  onOpenProject={handleOpenProject}
                  onRenameProject={handleOpenNameProjectDialog}
                />
                <SortInput
                  value={orderByField}
                  onSelectChange={handleOrderByFieldChange}
                  order={orderByDirection}
                  toggleOrder={toggleOrderByDirection}
                  marginLeft="auto"
                  hasSearchQuery={!!query}
                />
              </HStack>
              <SimpleGrid mt={3} spacing={3} columns={[1, 2, 3, 4, 5]}>
                {processedProjects.map((projectData) => (
                  <ProjectCard
                    key={projectData.id}
                    projectData={projectData}
                    projectCardActions={
                      <ProjectCardActions
                        id={projectData.id}
                        isSelected={selectedProjectIds.includes(projectData.id)}
                        onSelected={updateSelectedProjects}
                        onDeleteProject={handleDeleteProject}
                        onOpenProject={handleOpenProject}
                        onRenameProject={handleOpenNameProjectDialog}
                        setFinalFocusRef={setFinalFocusRef}
                      />
                    }
                  />
                ))}
              </SimpleGrid>
            </Container>
          </VStack>
        </DefaultPageLayout>
      </Await>
    </Suspense>
  );
};

export default ProjectsPage;

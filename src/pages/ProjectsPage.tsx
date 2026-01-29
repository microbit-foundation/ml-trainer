import {
  Box,
  Button,
  ButtonGroup,
  Container,
  HStack,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import orderBy from "lodash.orderby";
import { Suspense, useCallback, useState } from "react";
import { Await, useLoaderData, useNavigate } from "react-router";
import BackArrow from "../components/BackArrow";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import LoadingPage from "../components/LoadingPage";
import { NameProjectDialog } from "../components/NameProjectDialog";
import ProjectCard from "../components/ProjectCard";
import Search from "../components/Search";
import SortInput from "../components/SortInput";
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";
import ProjectCardActions from "../components/ProjectCardActions";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFolderOpenLine,
} from "react-icons/ri";

type OrderByField = "timestamp" | "name";

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
    setOrderByField(e.target.value as OrderByField);
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

  const processedProjects = orderBy(
    allProjectData.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    ),
    orderByField === "name" ? (p) => p.name.toLowerCase() : orderByField,
    orderByDirection
  );

  return (
    <Suspense fallback={<LoadingPage />}>
      <Await resolve={allProjectDataLoaded}>
        <NameProjectDialog
          projectName={projectName}
          isOpen={nameDialogIsOpen}
          onClose={handleNameProjectDialogClose}
          onSave={handleRenameProject}
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
                <ButtonGroup>
                  {selectedProjectIds.length === 1 && (
                    <Button
                      onClick={() => handleOpenProject()}
                      leftIcon={<RiFolderOpenLine />}
                      borderRadius="md"
                      variant="toolbar"
                      _focusVisible={{ boxShadow: "outline" }}
                    >
                      Open
                    </Button>
                  )}
                  {selectedProjectIds.length === 1 && (
                    <Button
                      onClick={() => handleOpenNameProjectDialog()}
                      leftIcon={<RiEdit2Line />}
                      borderRadius="md"
                      variant="toolbar"
                      _focusVisible={{ boxShadow: "outline" }}
                    >
                      Rename
                    </Button>
                  )}
                  {selectedProjectIds.length !== 0 && (
                    <Button
                      onClick={() => handleDeleteProject()}
                      leftIcon={<RiDeleteBin2Line />}
                      borderRadius="md"
                      variant="warning"
                    >
                      Delete
                    </Button>
                  )}
                </ButtonGroup>
                <SortInput
                  value={orderByField}
                  onSelectChange={handleOrderByFieldChange}
                  order={orderByDirection}
                  toggleOrder={toggleOrderByDirection}
                  marginLeft="auto"
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

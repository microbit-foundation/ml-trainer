import {
  Button,
  Container,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
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
import { loadProjectAndModelFromStorage, useStore } from "../store";
import { createDataSamplesPageUrl, createHomePageUrl } from "../urls";
import orderBy from "lodash.orderby";
import { RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";

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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

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

  const handleOpenProject = useCallback(async () => {
    await loadProjectAndModelFromStorage(selectedProjects[0]);
    navigate(createDataSamplesPageUrl());
  }, [navigate, selectedProjects]);

  const handleDeleteProject = useCallback(async () => {
    if (selectedProjects.length === 1) {
      return deleteProject(selectedProjects[0]);
    }
    await deleteProjects(selectedProjects);
  }, [deleteProject, deleteProjects, selectedProjects]);

  const updateSelectedProjects = useCallback(
    (id: string, e: React.MouseEvent) => {
      setSelectedProjects((prev) => {
        if (e.ctrlKey || e.metaKey) {
          if (prev.includes(id)) {
            return prev.filter((v) => v !== id);
          }
          return [...prev, id];
        }
        if (e.shiftKey) {
          // TODO - shift selection
          // Need to use indexed based selection.
          // Need to keep track of last single selected card.
        }
        // Click without any modifier - single selection.
        if (prev.includes(id)) {
          return [];
        }
        return [id];
      });
    },
    []
  );

  const [nameDialogIsOpen, setNameDialogIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const handleOpenNameProjectDialog = useCallback(() => {
    const projectId = selectedProjects[0];
    const project = allProjectData.find((p) => p.id === projectId);
    if (project) {
      setProjectName(project.name);
      setNameDialogIsOpen(true);
    }
  }, [allProjectData, selectedProjects]);

  const handleNameProjectDialogClose = useCallback(() => {
    setNameDialogIsOpen(false);
  }, []);

  const handleRenameProject = useCallback(
    async (name: string | undefined) => {
      await renameProject(selectedProjects[0], name ?? "");
      setNameDialogIsOpen(false);
    },
    [renameProject, selectedProjects]
  );

  const [searchString, setSearchString] = useState("");
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchString(e.target.value);
    },
    []
  );

  const processedProjects = orderBy(
    allProjectData.filter((p) =>
      p.name.toLowerCase().includes(searchString.toLowerCase())
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
            <Container maxW="1180px" alignItems="stretch" p={4} mt={8}>
              <Input
                mb={2}
                placeholder="Search"
                value={searchString}
                onChange={handleSearchInputChange}
              />
              <HStack>
                <Button
                  isDisabled={selectedProjects.length !== 1}
                  onClick={handleOpenProject}
                >
                  Open
                </Button>
                <Button
                  isDisabled={selectedProjects.length !== 1}
                  onClick={handleOpenNameProjectDialog}
                >
                  Rename
                </Button>
                <Button
                  isDisabled={!selectedProjects.length}
                  onClick={handleDeleteProject}
                >
                  Delete
                </Button>
                <Select
                  value={orderByField}
                  onChange={handleOrderByFieldChange}
                >
                  <option value="name">Name</option>
                  <option value="timestamp">Last modified</option>
                </Select>
                <IconButton
                  aria-label="toggle..."
                  onClick={toggleOrderByDirection}
                  icon={
                    orderByDirection === "asc" ? (
                      <RiArrowUpLine />
                    ) : (
                      <RiArrowDownLine />
                    )
                  }
                />
              </HStack>
              <SimpleGrid mt={3} spacing={3} columns={[1, 2, 3, 4, 5]}>
                {processedProjects.map((projectData) => (
                  <ProjectCard
                    key={projectData.id}
                    projectData={projectData}
                    isSelected={selectedProjects.includes(projectData.id)}
                    onClick={(e) => updateSelectedProjects(projectData.id, e)}
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

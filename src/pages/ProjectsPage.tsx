import {
  Button,
  Container,
  Grid,
  GridItem,
  HStack,
  VStack,
} from "@chakra-ui/react";
import DefaultPageLayout, {
  HomeMenuItem,
  HomeToolbarItem,
} from "../components/DefaultPageLayout";
import { Suspense, useCallback, useState } from "react";
import { Await, useLoaderData, useNavigate } from "react-router";
import LoadingPage from "../components/LoadingPage";
import { useStore } from "../store";
import ProjectCard from "../components/ProjectCard";
import BackArrow from "../components/BackArrow";
import { createHomePageUrl } from "../urls";

const ProjectsPage = () => {
  const { allProjectDataLoaded } = useLoaderData() as {
    allProjectDataLoaded: boolean;
  };
  const allProjectData = useStore((s) => s.allProjectData);
  const deleteProject = useStore((s) => s.deleteProject);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleOpenProject = useCallback(() => {
    console.log("open project - does nothing");
  }, []);

  const handleRenameProject = useCallback(() => {
    console.log("rename project - does nothing");
  }, []);

  const handleDeleteProject = useCallback(async () => {
    await deleteProject(selectedProjects[0]);
  }, [deleteProject, selectedProjects]);

  const updateSelectedProjects = useCallback((id: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  }, []);

  const navigate = useNavigate();
  const navigateToHomePage = useCallback(() => {
    navigate(createHomePageUrl());
  }, [navigate]);
  return (
    <Suspense fallback={<LoadingPage />}>
      <Await resolve={allProjectDataLoaded}>
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
              <HStack>
                <Button
                  isDisabled={selectedProjects.length !== 1}
                  onClick={handleOpenProject}
                >
                  Open
                </Button>
                <Button
                  isDisabled={selectedProjects.length !== 1}
                  onClick={handleRenameProject}
                >
                  Rename
                </Button>
                <Button
                  isDisabled={selectedProjects.length !== 1}
                  onClick={handleDeleteProject}
                >
                  Delete
                </Button>
              </HStack>
              <Grid mt={3} gap={3} templateColumns="repeat(5, 1fr)">
                {allProjectData.map((projectData) => (
                  <GridItem key={projectData.id} h="100%">
                    <ProjectCard
                      projectData={projectData}
                      isSelected={selectedProjects.includes(projectData.id)}
                      onClick={() => updateSelectedProjects(projectData.id)}
                    />
                  </GridItem>
                ))}
              </Grid>
            </Container>
          </VStack>
        </DefaultPageLayout>
      </Await>
    </Suspense>
  );
};

export default ProjectsPage;

import { usePrevious } from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useGestureData } from "./gestures-hooks";
import { useStorage } from "./hooks/use-storage";
import { generateCustomFiles, generateProject } from "./makecode/utils";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";

interface StoredProject {
  project: MakeCodeProject;
  projectEdited: boolean;
}

interface ProjectContext extends StoredProject {
  writeProject: (project: MakeCodeProject) => void;
  updateProject: () => void;
  resetProject: () => void;
  editorWrite: MutableRefObject<
    ((payload: MakeCodeProject) => void) | undefined
  >;
}

const ProjectContext = createContext<ProjectContext | undefined>(undefined);

export const useProject = (): ProjectContext => {
  const project = useContext(ProjectContext);
  if (!project) {
    throw new Error("Missing provider");
  }
  return project;
};

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [gestureData] = useGestureData();
  const [status] = useMlStatus();
  const [{ project, projectEdited }, setProject] = useStorage<StoredProject>(
    "local",
    "project",
    {
      project: generateProject(
        gestureData.data,
        (status as TrainingCompleteMlStatus).model
      ),
      projectEdited: false,
    }
  );
  const editorWrite: MutableRefObject<
    ((payload: MakeCodeProject) => void) | undefined
  > = useRef();

  const prevGestureData = usePrevious(gestureData);
  const prevModelDefined = usePrevious(
    !!(status as TrainingCompleteMlStatus).model
  );

  const updateProject = useCallback(() => {
    const gestures = gestureData.data;
    const model = (status as TrainingCompleteMlStatus).model;
    if (!projectEdited) {
      const newProject = generateProject(gestures, model);
      setProject({
        project: newProject,
        projectEdited,
      });
      if (editorWrite.current) {
        editorWrite.current(newProject);
      }
    } else {
      const updatedProject = {
        text: {
          ...project.text,
          ...generateCustomFiles(gestures, model),
        },
      };
      setProject({
        project: updatedProject,
        projectEdited,
      });
      if (editorWrite.current) {
        editorWrite.current(updatedProject);
      }
    }
  }, [gestureData.data, project.text, projectEdited, setProject, status]);

  useEffect(() => {
    const modelDefined = !!(status as TrainingCompleteMlStatus).model;
    if (
      JSON.stringify(prevGestureData?.data) ===
        JSON.stringify(gestureData.data) &&
      modelDefined === prevModelDefined
    ) {
      return;
    }
    updateProject();
  }, [
    gestureData.data,
    prevGestureData,
    prevModelDefined,
    project.text,
    projectEdited,
    setProject,
    status,
    updateProject,
  ]);

  const resetProject = useCallback(() => {
    const newProject = generateProject(
      gestureData.data,
      (status as TrainingCompleteMlStatus).model
    );
    setProject({
      project: newProject,
      projectEdited: false,
    });
    if (editorWrite.current) {
      editorWrite.current(newProject);
    }
  }, [gestureData.data, setProject, status]);

  const writeProject = useCallback(
    (code: MakeCodeProject) => {
      setProject({ project: code, projectEdited: true });
    },
    [setProject]
  );

  const value = {
    project,
    projectEdited,
    writeProject,
    updateProject,
    resetProject,
    editorWrite,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

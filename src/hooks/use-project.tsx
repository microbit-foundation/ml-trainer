import {
  EditorProject,
  MakeCodeProject,
} from "@microbit-foundation/react-editor-embed";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
} from "react";
import { generateProject, updateProjectFiles } from "../utils/project-utils";
import { Gesture, useGestures } from "./use-gestures";
import { TrainingCompleteMlStatus, useMlStatus } from "./use-ml-status";
import { useStorage } from "./use-storage";
import { LayersModel } from "@tensorflow/tfjs";

interface StoredProject {
  project: EditorProject;
  projectEdited: boolean;
}

interface ProjectContext extends StoredProject {
  writeProject: (project: EditorProject) => void;
  resetProject: () => void;
  updateProject: (gestures: Gesture[], model: LayersModel | undefined) => void;
  editorWrite: MutableRefObject<((payload: EditorProject) => void) | undefined>;
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
  const [gestures] = useGestures();
  const [status] = useMlStatus();
  const [{ project, projectEdited }, setProject] = useStorage<StoredProject>(
    "local",
    "project",
    {
      project: generateProject(
        gestures,
        (status as TrainingCompleteMlStatus).model
      ),
      projectEdited: false,
    }
  );

  const editorWrite: MutableRefObject<
    ((payload: EditorProject) => void) | undefined
  > = useRef();

  const updateProject = useCallback(
    (gestures: Gesture[], model: LayersModel | undefined) => {
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
            ...(project as MakeCodeProject).text,
            ...updateProjectFiles(gestures, model),
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
    },
    [project, projectEdited, setProject]
  );

  const resetProject = useCallback(() => {
    const newProject = generateProject(
      gestures,
      (status as TrainingCompleteMlStatus).model
    );
    setProject({
      project: newProject,
      projectEdited: false,
    });
    if (editorWrite.current) {
      editorWrite.current(newProject);
    }
  }, [gestures, setProject, status]);

  const writeProject = useCallback(
    (code: EditorProject) => {
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

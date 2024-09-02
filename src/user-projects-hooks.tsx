import { usePrevious } from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import debounce from "lodash.debounce";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGestureData } from "./gestures-hooks";
import { useStorage } from "./hooks/use-storage";
import { generateCustomFiles, generateProject } from "./makecode/utils";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";
import { ActionListenerSubject } from "@microbit-foundation/react-editor-embed";
import { Subject } from "rxjs";

interface StoredProject {
  project: MakeCodeProject;
  projectEdited: boolean;
}

export type ProjectIOState = "downloading" | "importing" | "inactive";

interface ProjectContext extends StoredProject {
  writeProject: (project: MakeCodeProject) => void;
  updateProject: () => void;
  resetProject: () => void;
  editorWrite: MutableRefObject<
    ((payload: MakeCodeProject) => void) | undefined
  >;
  editorEventTrigger: Subject<ActionListenerSubject>;
  projectIOState: ProjectIOState;
  setProjectIOState: (value: ProjectIOState) => void;
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

  const debouncedEditorUpdate = useMemo(
    () =>
      debounce(
        (
          writer: (payload: MakeCodeProject) => void,
          project: MakeCodeProject
        ) => {
          writer(project);
        },
        300
      ),
    []
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
        debouncedEditorUpdate(editorWrite.current, newProject);
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
        debouncedEditorUpdate(editorWrite.current, updatedProject);
      }
    }
  }, [
    debouncedEditorUpdate,
    gestureData.data,
    project.text,
    projectEdited,
    setProject,
    status,
  ]);

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

  const editorEventTrigger = useMemo(
    () => new Subject<ActionListenerSubject>(),
    []
  );

  const [projectIOState, setProjectIOState] =
    useState<ProjectIOState>("inactive");

  const value = {
    project,
    projectEdited,
    writeProject,
    updateProject,
    resetProject,
    editorWrite,
    editorEventTrigger,
    projectIOState,
    setProjectIOState,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

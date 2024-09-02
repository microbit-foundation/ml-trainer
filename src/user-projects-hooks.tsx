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
import {
  GestureData,
  useGestureActions,
  useGestureData,
} from "./gestures-hooks";
import { useStorage } from "./hooks/use-storage";
import { generateCustomFiles, generateProject } from "./makecode/utils";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";
import { ActionListenerSubject } from "@microbit-foundation/react-editor-embed";
import { Subject } from "rxjs";
import { getLowercaseFileExtension, readFileAsText } from "./utils/fs-util";

interface StoredProject {
  project: MakeCodeProject;
  projectEdited: boolean;
}

export type ProjectIOState = "downloading" | "importing" | "inactive";

interface ProjectContext extends StoredProject {
  writeProject: (project: MakeCodeProject) => void;
  updateProject: () => void;
  resetProject: () => void;
  loadProject: (files: File[]) => void;
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
  const [gestures] = useGestureData();
  const gestureActions = useGestureActions();
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
    ((payload: MakeCodeProject) => void) | undefined
  > = useRef();

  const prevGestureData = usePrevious(gestures);
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
    gestures,
    project.text,
    projectEdited,
    setProject,
    status,
  ]);

  useEffect(() => {
    const modelDefined = !!(status as TrainingCompleteMlStatus).model;
    if (
      prevGestureData?.lastModified === gestures.lastModified &&
      modelDefined === prevModelDefined
    ) {
      return;
    }
    updateProject();
  }, [
    gestures.lastModified,
    prevGestureData?.lastModified,
    prevModelDefined,
    status,
    updateProject,
  ]);

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

  const loadProject = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length !== 1) {
        throw new Error("Expected to be called with one file");
      }

      const file = files[0];

      const fileExtension = getLowercaseFileExtension(file.name);

      if (fileExtension === "json") {
        const gestureData = await readFileAsText(files[0]);
        gestureActions.validateAndSetGestures(
          JSON.parse(gestureData) as Partial<GestureData>[]
        );
      }

      if (fileExtension === "hex") {
        setProjectIOState("importing");
        // TODO: Use the code below to import a hex into MakeCode with the
        // new version of react-editor-embed.
        // const hex = await readFileAsText(file);
        // editorEventTrigger?.next({
        //   type: "importfile",
        //   filename: file.name,
        //   parts: hex,
        // });
      }
    },
    [gestureActions]
  );

  const value = {
    project,
    projectEdited,
    writeProject,
    updateProject,
    resetProject,
    loadProject,
    editorWrite,
    editorEventTrigger,
    projectIOState,
    setProjectIOState,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

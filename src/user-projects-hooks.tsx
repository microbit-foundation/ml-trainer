import { usePrevious } from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import {
  ActionListenerSubject,
  CommonEditorMessageAction,
  ResponseEmitterSubject,
} from "@microbit-foundation/react-editor-embed";
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
import { Subject } from "rxjs";
import {
  GestureData,
  useGestureActions,
  useGestureData,
} from "./gestures-hooks";
import { useStorage } from "./hooks/use-storage";
import { generateCustomFiles, generateProject } from "./makecode/utils";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";
import { getLowercaseFileExtension, readFileAsText } from "./utils/fs-util";

interface StoredProject {
  project: MakeCodeProject;
  projectEdited: boolean;
}

interface EditorMessage {
  data: {
    action?: string;
    project?: MakeCodeProject;
  };
}

interface FullMakeCodeProject extends MakeCodeProject {
  header: Record<string, unknown>;
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
  editorEventEmitter: Subject<ResponseEmitterSubject>;
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
      const newProject = {
        ...project,
        text: {
          ...project.text,
          ...generateProject(gestures, model).text,
        },
      };
      setProject({
        project: newProject,
        projectEdited,
      });
      if (editorWrite.current) {
        debouncedEditorUpdate(editorWrite.current, newProject);
      }
    } else {
      const updatedProject = {
        ...project,
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
    project,
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
    const newProject = {
      ...project,
      text: {
        ...project.text,
        ...generateProject(gestures, (status as TrainingCompleteMlStatus).model)
          .text,
      },
    };
    setProject({
      project: newProject,
      projectEdited: false,
    });
    if (editorWrite.current) {
      editorWrite.current(newProject);
    }
  }, [gestures, project, setProject, status]);

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
  const editorEventEmitter = useMemo(
    () => new Subject<ResponseEmitterSubject>(),
    []
  );

  useEffect(() => {
    const listener = (resp: ResponseEmitterSubject) => {
      const msg = resp as EditorMessage;
      if (
        msg.data.action === CommonEditorMessageAction.workspacesave &&
        !(project as FullMakeCodeProject).header
      ) {
        // Get the header provided by MakeCode on first workspacesave if we don't already have one.
        // This is a work around for https://github.com/microsoft/pxt-microbit/issues/5896.
        if (msg.data.project) {
          const newProject = {
            ...project,
            text: {
              ...project.text,
              ...generateProject(
                gestures,
                (status as TrainingCompleteMlStatus).model
              ).text,
            },
          };
          if (editorWrite.current) {
            editorWrite.current(newProject);
          }
          setProject({
            project: newProject,
            projectEdited: false,
          });
        }
      }
    };
    editorEventEmitter.subscribe(listener);
    return () => {
      // TODO: This explodes. Why?
      // editorEventEmitter.unsubscribe();
    };
  }, [
    editorEventEmitter,
    editorEventTrigger,
    gestures,
    project,
    setProject,
    status,
    writeProject,
  ]);

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
    editorEventEmitter,
    projectIOState,
    setProjectIOState,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

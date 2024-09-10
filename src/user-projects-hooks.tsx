import { usePrevious } from "@chakra-ui/react";
import { MakeCodeFrameDriver, Project } from "@microbit/makecode-embed/react";
import debounce from "lodash.debounce";
import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { getLowercaseFileExtension, readFileAsText } from "./utils/fs-util";

interface StoredProject {
  project: Project;
  projectEdited: boolean;
}

export type ProjectIOState = "downloading" | "importing" | "inactive";

interface ProjectContext extends StoredProject {
  writeProject: (project: Project) => void;
  updateProject: () => void;
  resetProject: () => void;
  loadProject: (files: File[]) => void;
  projectIOState: ProjectIOState;
  setProjectIOState: (value: ProjectIOState) => void;
  downloadHex: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContext | undefined>(undefined);

export const useProject = (): ProjectContext => {
  const project = useContext(ProjectContext);
  if (!project) {
    throw new Error("Missing provider");
  }
  return project;
};

interface ProjectProviderProps {
  driverRef: RefObject<MakeCodeFrameDriver>;
  children: ReactNode;
}

export const ProjectProvider = ({
  driverRef,
  children,
}: ProjectProviderProps) => {
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
  const prevGestureData = usePrevious(gestures);
  const prevModelDefined = usePrevious(
    !!(status as TrainingCompleteMlStatus).model
  );

  const debouncedEditorUpdate = useMemo(
    () =>
      debounce((project: Project) => {
        // TODO: consider logging if this fails?
        void driverRef.current?.importProject({ project });
      }, 300),
    [driverRef]
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
      debouncedEditorUpdate(newProject);
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
      debouncedEditorUpdate(updatedProject);
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
    void driverRef.current?.importProject({ project: newProject });
  }, [driverRef, gestures, project, setProject, status]);

  const writeProject = useCallback(
    (code: Project) => {
      setProject({ project: code, projectEdited: true });
    },
    [setProject]
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
        driverRef.current!.importFile({
          filename: file.name,
          parts: [await readFileAsText(files[0])],
        });
      }
    },
    [driverRef, gestureActions]
  );

  const downloadHex = useCallback(async (): Promise<void> => {
    await driverRef.current!.compile();
  }, [driverRef]);

  const value = useMemo(
    () => ({
      downloadHex,
      loadProject,
      project,
      projectEdited,
      projectIOState,
      resetProject,
      setProjectIOState,
      updateProject,
      writeProject,
    }),
    [
      downloadHex,
      loadProject,
      project,
      projectEdited,
      projectIOState,
      resetProject,
      updateProject,
      writeProject,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

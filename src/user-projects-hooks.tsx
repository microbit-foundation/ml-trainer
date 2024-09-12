import { usePrevious } from "@chakra-ui/react";
import {
  EditorWorkspaceSaveRequest,
  MakeCodeFrameDriver,
  MakeCodeFrameProps,
  Project,
} from "@microbit/makecode-embed/react";
import debounce from "lodash.debounce";
import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useConnectionStage } from "./connection-stage-hooks";
import {
  GestureContextState,
  GestureData,
  useGestureActions,
  useGestureData,
} from "./gestures-hooks";
import { useStorage } from "./hooks/use-storage";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import {
  MlStage,
  TrainingCompleteMlStatus,
  useMlStatus,
} from "./ml-status-hooks";
import { getLowercaseFileExtension, readFileAsText } from "./utils/fs-util";
import { useEditCodeDialog } from "./hooks/use-edit-code-dialog";

interface StoredProject {
  project: Project;
  projectEdited: boolean;
}

interface ProjectContext extends StoredProject {
  resetProject: () => void;
  loadProject: (files: File[]) => void;
  saveProjectHex: () => Promise<void>;
  editorCallbacks: Pick<
    MakeCodeFrameProps,
    "onDownload" | "onWorkspaceSave" | "onSave" | "onBack"
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

interface ProjectProviderProps {
  driverRef: RefObject<MakeCodeFrameDriver>;
  children: ReactNode;
}

export const ProjectProvider = ({
  driverRef,
  children,
}: ProjectProviderProps) => {
  // We use this to track when we need special handling of an event from MakeCode
  const waitingForWorkspaceSave = useRef<
    undefined | ((project: Project) => void)
  >(undefined);
  const waitForNextWorkspaceSave = useCallback(() => {
    return new Promise<Project>((resolve) => {
      waitingForWorkspaceSave.current = (project) => {
        resolve(project);
        waitingForWorkspaceSave.current = undefined;
      };
    });
  }, []);
  // We use this to track when we're expecting a native app save from MakeCode
  const waitingForDownload = useRef<
    undefined | ((download: { hex: string; name: string }) => void)
  >(undefined);
  const waitForNextDownload = useCallback(() => {
    return new Promise<{ hex: string; name: string }>((resolve) => {
      waitingForDownload.current = (download: {
        hex: string;
        name: string;
      }) => {
        resolve(download);
        waitingForDownload.current = undefined;
      };
    });
  }, []);

  const makecodeDisclosure = useEditCodeDialog();
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

  // TODO: can we adjust state management so it happens more directly in respose to gesture changes?
  useEffect(() => {
    const model =
      status.stage === MlStage.TrainingComplete ? status.model : undefined;
    const modelDefined = !!model;
    if (
      prevGestureData?.lastModified === gestures.lastModified &&
      modelDefined === prevModelDefined
    ) {
      return;
    }

    const updatedProject = {
      ...project,
      text: {
        ...project.text,
        ...(projectEdited
          ? generateCustomFiles(gestures, model)
          : generateProject(gestures, model).text),
      },
    };
    setProject({
      project: updatedProject,
      projectEdited,
    });
    debouncedEditorUpdate(updatedProject);
  }, [
    debouncedEditorUpdate,
    gestures,
    gestures.lastModified,
    prevGestureData?.lastModified,
    prevModelDefined,
    project,
    projectEdited,
    setProject,
    status,
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
      } else if (fileExtension === "hex") {
        driverRef.current!.importFile({
          filename: file.name,
          parts: [await readFileAsText(files[0])],
        });
        const project = await waitForNextWorkspaceSave();
        const gestureData = project.text![filenames.datasetJson];
        // TODO: validation? this could be any old MakeCode project
        // so we need to load the gestures and perform an update on the project
        // ... we have to assume the user has edited the projet.
        gestureActions.validateAndSetGestures(
          (JSON.parse(gestureData) as GestureContextState).data
        );
        setProject({ project, projectEdited: true });

        // TODO: navigate to data samples as you could be on the home page, model page etc.
      }
    },
    [driverRef, gestureActions, setProject, waitForNextWorkspaceSave]
  );

  const saveProjectHex = useCallback(async (): Promise<void> => {
    const downloadPromise = waitForNextDownload();
    await driverRef.current!.compile();
    const download = await downloadPromise;
    triggerBrowserDownload(download);
  }, [driverRef, waitForNextDownload]);

  // These are event handlers for MakeCode

  const onWorkspaceSave = useCallback(
    (event: EditorWorkspaceSaveRequest) => {
      const { project: newProject } = event;
      if (waitingForWorkspaceSave.current) {
        waitingForWorkspaceSave.current(event.project);
      } else if (makecodeDisclosure.isOpen) {
        // Could be a blocks edit but could also be a hex load inside of MakeCode
        // We can probably distinguish these in future by looking at the header id

        const newProjectHeaderId = newProject.header?.id;
        const oldProjectHeaderId = project.header?.id;
        console.log({ newProjectHeaderId, oldProjectHeaderId });

        setProject({ project, projectEdited: true });
        const gestureData = project.text![filenames.datasetJson];
        if (gestureData) {
          const parsedGestureData = JSON.parse(
            gestureData
          ) as GestureContextState;
          if (parsedGestureData.lastModified !== gestures.lastModified) {
            gestureActions.validateAndSetGestures(parsedGestureData.data);
          }
        }
      }
    },
    [
      gestureActions,
      gestures.lastModified,
      makecodeDisclosure.isOpen,
      project,
      setProject,
    ]
  );

  const onSave = useCallback((save: { name: string; hex: string }) => {
    // Handles the event we get from MakeCode to say a hex needs saving to disk.
    // In practice this is via "Download" ... "Save as file"
    // TODO: give this the same behaviour as SaveButton in terms of dialogs etc.
    triggerBrowserDownload(save);
  }, []);

  const { actions } = useConnectionStage();

  const onDownload = useCallback(
    // Handles the event we get from MakeCode to say a hex needs downloading to the micro:bit.
    async (download: { name: string; hex: string }) => {
      if (waitingForDownload?.current) {
        waitingForDownload.current(download);
      } else {
        // Ideally we'd preserve the filename here and use it for the fallback if WebUSB fails.
        await actions.startDownloadUserProjectHex(download.hex);
      }
    },
    [actions]
  );

  const onBack = useCallback(() => {
    makecodeDisclosure.onClose?.();
  }, [makecodeDisclosure]);

  const value = useMemo(
    () => ({
      loadProject,
      project,
      projectEdited,
      resetProject,
      saveProjectHex,
      editorCallbacks: {
        onSave,
        onWorkspaceSave,
        onDownload,
        onBack,
      },
    }),
    [
      loadProject,
      project,
      projectEdited,
      resetProject,
      saveProjectHex,
      onSave,
      onWorkspaceSave,
      onDownload,
      onBack,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

const triggerBrowserDownload = (save: { name: string; hex: string }) => {
  const blob = new Blob([save.hex], { type: "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${save.name}.hex`;
  a.click();
  URL.revokeObjectURL(a.href);
};

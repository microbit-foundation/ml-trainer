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
import { FlushType, useAppStore } from "./store";
import { getLowercaseFileExtension, readFileAsText } from "./utils/fs-util";

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
  const onBack = useAppStore((s) => s.closeEditor);

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

  const debouncedEditorUpdate = useMemo(
    () =>
      debounce((project: Project) => {
        // TODO: consider logging if this fails?
        void driverRef.current?.importProject({ project });
      }, 300),
    [driverRef]
  );

  const project = useAppStore((s) => s.project);
  const projectEdited = useAppStore((s) => s.projectEdited);
  const appEditNeedsFlushToEditor = useAppStore(
    (s) => s.appEditNeedsFlushToEditor
  );
  const projectFlushedToEditor = useAppStore((s) => s.projectFlushedToEditor);
  useEffect(() => {
    // We set this when we make changes to the project in the app rather than via MakeCode
    if (appEditNeedsFlushToEditor) {
      if (appEditNeedsFlushToEditor === FlushType.Debounced) {
        debouncedEditorUpdate(project);
      } else {
        void driverRef.current?.importProject({ project });
      }
      projectFlushedToEditor();
    }
  }, [
    debouncedEditorUpdate,
    appEditNeedsFlushToEditor,
    projectFlushedToEditor,
    project,
    driverRef,
  ]);

  const resetProject = useAppStore((s) => s.resetProject);
  const loadProjectState = useAppStore((s) => s.loadProject);
  const loadDataset = useAppStore((s) => s.loadDataset);

  const loadProject = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length !== 1) {
        throw new Error("Expected to be called with one file");
      }
      const file = files[0];
      const fileExtension = getLowercaseFileExtension(file.name);
      if (fileExtension === "json") {
        const gestureData = await readFileAsText(files[0]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        loadDataset(JSON.parse(gestureData));
      } else if (fileExtension === "hex") {
        driverRef.current!.importFile({
          filename: file.name,
          parts: [await readFileAsText(files[0])],
        });
        const project = await waitForNextWorkspaceSave();
        loadProjectState(project);
      }
    },
    [driverRef, loadDataset, loadProjectState, waitForNextWorkspaceSave]
  );

  const saveProjectHex = useCallback(async (): Promise<void> => {
    const downloadPromise = waitForNextDownload();
    await driverRef.current!.compile();
    const download = await downloadPromise;
    triggerBrowserDownload(download);
  }, [driverRef, waitForNextDownload]);

  // These are event handlers for MakeCode

  const editorChange = useAppStore((s) => s.editorChange);
  const onWorkspaceSave = useCallback(
    (event: EditorWorkspaceSaveRequest) => {
      if (waitingForWorkspaceSave.current) {
        waitingForWorkspaceSave.current(event.project);
      } else {
        editorChange(event.project);
      }
    },
    [editorChange]
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

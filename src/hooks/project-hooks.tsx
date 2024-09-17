import {
  EditorWorkspaceSaveRequest,
  MakeCodeFrameDriver,
  MakeCodeFrameProps,
  Project,
} from "@microbit/makecode-embed/react";
import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useConnectionStage } from "../connection-stage-hooks";
import { isDatasetUserFileFormat } from "../model";
import { useAppStore } from "../store";
import { getLowercaseFileExtension, readFileAsText } from "../utils/fs-util";

interface ProjectContext {
  openEditor(): Promise<void>;
  project: Project;
  projectEdited: boolean;
  resetProject: () => void;
  loadProject: (file: File) => void;
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
  const setEditorOpen = useAppStore((s) => s.setEditorOpen);

  // We use this to track when we need special handling of an event from MakeCode
  const waitingForEditorContentLoaded = useRef<undefined | (() => void)>(
    undefined
  );

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

  const project = useAppStore((s) => s.project);
  const projectEdited = useAppStore((s) => s.projectEdited);
  const expectChangedHeader = useAppStore((s) => s.expectChangedHeader);
  const projectFlushedToEditor = useAppStore((s) => s.projectFlushedToEditor);
  const appEditNeedsFlushToEditor = useAppStore(
    (s) => s.appEditNeedsFlushToEditor
  );
  const doAfterMakeCodeUpdate = useCallback(
    async (action: () => Promise<void>) => {
      if (appEditNeedsFlushToEditor) {
        expectChangedHeader();
        await driverRef.current!.importProject({ project });
        projectFlushedToEditor();
      }
      return action();
    },
    [
      appEditNeedsFlushToEditor,
      driverRef,
      expectChangedHeader,
      project,
      projectFlushedToEditor,
    ]
  );
  const openEditor = useCallback(async () => {
    await doAfterMakeCodeUpdate(() => {
      setEditorOpen(true);
      return Promise.resolve();
    });
  }, [doAfterMakeCodeUpdate, setEditorOpen]);

  const resetProject = useAppStore((s) => s.resetProject);
  const loadDataset = useAppStore((s) => s.loadDataset);

  const loadProject = useCallback(
    async (file: File): Promise<void> => {
      const fileExtension = getLowercaseFileExtension(file.name);
      if (fileExtension === "json") {
        const gestureDataString = await readFileAsText(file);
        const gestureData = JSON.parse(gestureDataString) as unknown;
        if (isDatasetUserFileFormat(gestureData)) {
          loadDataset(gestureData);
        } else {
          // TODO: complain to the user!
        }
      } else if (fileExtension === "hex") {
        driverRef.current!.importFile({
          filename: file.name,
          parts: [await readFileAsText(file)],
        });
      }
    },
    [driverRef, loadDataset]
  );

  const saveProjectHex = useCallback(async (): Promise<void> => {
    await doAfterMakeCodeUpdate(async () => {
      const downloadPromise = waitForNextDownload();
      await driverRef.current!.compile();
      const download = await downloadPromise;
      triggerBrowserDownload(download);
    });
  }, [doAfterMakeCodeUpdate, driverRef, waitForNextDownload]);

  // These are event handlers for MakeCode

  const editorChange = useAppStore((s) => s.editorChange);
  const onWorkspaceSave = useCallback(
    (event: EditorWorkspaceSaveRequest) => {
      editorChange(event.project);
    },
    [editorChange]
  );

  const onBack = useCallback(() => setEditorOpen(false), [setEditorOpen]);

  const onSave = useCallback((save: { name: string; hex: string }) => {
    // Handles the event we get from MakeCode to say a hex needs saving to disk.
    // In practice this is via "Download" ... "Save as file"
    // TODO: give this the same behaviour as SaveButton in terms of dialogs etc.
    triggerBrowserDownload(save);
  }, []);

  const onEditorContentLoaded = useCallback(() => {
    waitingForEditorContentLoaded.current?.();
    waitingForEditorContentLoaded.current = undefined;
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
      openEditor,
      project,
      projectEdited,
      resetProject,
      saveProjectHex,
      editorCallbacks: {
        onSave,
        onWorkspaceSave,
        onDownload,
        onBack,
        onEditorContentLoaded,
      },
    }),
    [
      loadProject,
      onBack,
      onDownload,
      onEditorContentLoaded,
      onSave,
      onWorkspaceSave,
      openEditor,
      project,
      projectEdited,
      resetProject,
      saveProjectHex,
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

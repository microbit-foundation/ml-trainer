import {
  EditorWorkspaceSaveRequest,
  MakeCodeFrameDriver,
  MakeCodeFrameProps,
  Project,
} from "@microbit/makecode-embed/react";
import debounce from "lodash.debounce";
import {
  MutableRefObject,
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useConnectionStage } from "../connection-stage-hooks";
import { FlushType, useAppStore } from "../store";
import { getLowercaseFileExtension, readFileAsText } from "../utils/fs-util";
import { isDatasetUserFileFormat } from "../model";
import { PromiseQueue } from "../utils/promise-queue";

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

class EditorFlushHandler {
  constructor(
    private queue: PromiseQueue,
    private driver: RefObject<MakeCodeFrameDriver>,
    private editorContentLoadedCallbackRef: MutableRefObject<
      undefined | (() => void)
    >
  ) {}
  flushImmediate = async (headerId: string) => {
    await this.queue.add(async () => {
      await this.driver.current!.unloadProject();
      const done = new Promise<void>((resolve) => {
        this.editorContentLoadedCallbackRef.current = resolve;
      });
      await this.driver.current!.openHeader(headerId);
      await done;
    });
  };
  flushDebounced = debounce(this.flushImmediate, 300);
  afterCurrent = (action: () => Promise<void>) => this.queue.add(action);
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

  const editorFlushHandler = useRef(
    new EditorFlushHandler(
      new PromiseQueue(),
      driverRef,
      waitingForEditorContentLoaded
    )
  );
  const project = useAppStore((s) => s.project);
  const projectEdited = useAppStore((s) => s.projectEdited);
  const appEditNeedsFlushToEditor = useAppStore(
    (s) => s.appEditNeedsFlushToEditor
  );
  const projectFlushedToEditor = useAppStore((s) => s.projectFlushedToEditor);
  useEffect(() => {
    // We set this when we make changes to the project in the app rather than via MakeCode
    if (appEditNeedsFlushToEditor !== undefined) {
      if (appEditNeedsFlushToEditor === FlushType.Debounced) {
        void editorFlushHandler.current.flushDebounced(project.header!.id);
      } else {
        void editorFlushHandler.current.flushImmediate(project.header!.id);
      }
      projectFlushedToEditor();
    }
  }, [appEditNeedsFlushToEditor, projectFlushedToEditor, project, driverRef]);

  const openEditor = useCallback(() => {
    return editorFlushHandler.current.afterCurrent(() => {
      console.log("Opening MakeCode");
      setEditorOpen(true);
      return Promise.resolve();
    });
  }, [setEditorOpen]);

  const resetProject = useAppStore((s) => s.resetProject);
  const loadProjectState = useAppStore((s) => s.loadProject);
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

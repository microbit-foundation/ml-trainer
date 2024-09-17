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
import { isDatasetUserFileFormat } from "../model";
import { useStore } from "../store";
import {
  getLowercaseFileExtension,
  readFileAsText,
  triggerBrowserDownload,
} from "../utils/fs-util";
import { useDownloadActions } from "./download-hooks";

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
  const setEditorOpen = useStore((s) => s.setEditorOpen);
  const project = useStore((s) => s.project);
  const projectEdited = useStore((s) => s.projectEdited);
  const expectChangedHeader = useStore((s) => s.setChangedHeaderExpected);
  const projectFlushedToEditor = useStore((s) => s.projectFlushedToEditor);
  const appEditNeedsFlushToEditor = useStore(
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

  const resetProject = useStore((s) => s.resetProject);
  const loadDataset = useStore((s) => s.loadDataset);

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

  const saveNextDownloadRef = useRef(false);
  const saveProjectHex = useCallback(async (): Promise<void> => {
    await doAfterMakeCodeUpdate(async () => {
      saveNextDownloadRef.current = true;
      await driverRef.current!.compile();
    });
  }, [doAfterMakeCodeUpdate, driverRef]);

  // These are event handlers for MakeCode

  const editorChange = useStore((s) => s.editorChange);
  const onWorkspaceSave = useCallback(
    (event: EditorWorkspaceSaveRequest) => {
      editorChange(event.project);
    },
    [editorChange]
  );

  const onBack = useCallback(() => setEditorOpen(false), [setEditorOpen]);
  const onSave = useStore((s) => s.editorSave);
  const downloadActions = useDownloadActions();
  const onDownload = useCallback(
    (download: { hex: string; name: string }) => {
      console.log("onDownload", saveNextDownloadRef.current);
      if (saveNextDownloadRef.current) {
        saveNextDownloadRef.current = false;
        triggerBrowserDownload(download);
      } else {
        void downloadActions.start(download);
      }
    },
    [downloadActions]
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
      },
    }),
    [
      loadProject,
      onBack,
      onDownload,
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

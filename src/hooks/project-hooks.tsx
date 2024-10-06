import { useToast } from "@chakra-ui/react";
import {
  EditorWorkspaceSaveRequest,
  MakeCodeFrameDriver,
  MakeCodeFrameProps,
  Project,
} from "@microbit/makecode-embed/react";
import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useIntl } from "react-intl";
import { HexData, isDatasetUserFileFormat, SaveStep } from "../model";
import { useStore } from "../store";
import {
  downloadHex,
  getLowercaseFileExtension,
  readFileAsText,
} from "../utils/fs-util";
import { useDownloadActions } from "./download-hooks";

interface ProjectContext {
  openEditor(): Promise<void>;
  project: Project;
  projectEdited: boolean;
  resetProject: () => void;
  loadFile: (file: File) => void;
  /**
   * Called to request a save.
   *
   * Pass a project if we already have the content to download. Otherwise it will
   * be requested from the editor.
   *
   * The save is not necessarily complete when this returns as we may be waiting
   * on MakeCode or a dialog flow. The progress will be reflected in the `save`
   * state field.
   */
  saveHex: (hex?: HexData) => Promise<void>;

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
  const intl = useIntl();
  const toast = useToast();
  const setEditorOpen = useStore((s) => s.setEditorOpen);
  const projectEdited = useStore((s) => s.projectEdited);
  const expectChangedHeader = useStore((s) => s.setChangedHeaderExpected);
  const projectFlushedToEditor = useStore((s) => s.projectFlushedToEditor);
  const checkIfProjectNeedsFlush = useStore((s) => s.checkIfProjectNeedsFlush);
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const doAfterEditorUpdate = useCallback(
    async (action: () => Promise<void>) => {
      if (checkIfProjectNeedsFlush()) {
        const project = getCurrentProject();
        expectChangedHeader();
        await driverRef.current!.importProject({ project });
        projectFlushedToEditor();
      }
      return action();
    },
    [
      checkIfProjectNeedsFlush,
      getCurrentProject,
      driverRef,
      expectChangedHeader,
      projectFlushedToEditor,
    ]
  );
  const openEditor = useCallback(async () => {
    await doAfterEditorUpdate(() => {
      setEditorOpen(true);
      return Promise.resolve();
    });
  }, [doAfterEditorUpdate, setEditorOpen]);

  const resetProject = useStore((s) => s.resetProject);
  const loadDataset = useStore((s) => s.loadDataset);

  const loadFile = useCallback(
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

  const setSave = useStore((s) => s.setSave);
  const save = useStore((s) => s.save);
  const settings = useStore((s) => s.settings);
  const saveNextDownloadRef = useRef(false);
  const saveHex = useCallback(
    async (hex?: HexData): Promise<void> => {
      const { step } = save;
      if (hex) {
        if (settings.showPreSaveHelp && step === SaveStep.None) {
          // All we do is trigger the help and remember the project.
          setSave({
            step: SaveStep.PreSaveHelp,
            hex: hex,
          });
        } else {
          // We can just go ahead and download. Either the project came from
          // the editor or via the dialog flow.
          downloadHex(hex);
          setSave({
            step: SaveStep.None,
          });
          toast({
            id: "save-complete",
            position: "top",
            duration: 5_000,
            title: intl.formatMessage({ id: "saving-toast-title" }),
            status: "info",
          });
        }
      } else {
        // We need to request something to save.
        setSave({
          step: SaveStep.SaveProgress,
        });
        await doAfterEditorUpdate(async () => {
          saveNextDownloadRef.current = true;
          await driverRef.current!.compile();
        });
      }
    },
    [
      doAfterEditorUpdate,
      driverRef,
      intl,
      save,
      setSave,
      settings.showPreSaveHelp,
      toast,
    ]
  );

  // These are event handlers for MakeCode

  const editorChange = useStore((s) => s.editorChange);
  const onWorkspaceSave = useCallback(
    (event: EditorWorkspaceSaveRequest) => {
      console.log("onWorkspaceSave", event.project.header?.name);
      editorChange(event.project);
    },
    [editorChange]
  );

  const onBack = useCallback(() => setEditorOpen(false), [setEditorOpen]);
  const onSave = saveHex;
  const downloadActions = useDownloadActions();
  const onDownload = useCallback(
    (download: HexData) => {
      if (saveNextDownloadRef.current) {
        saveNextDownloadRef.current = false;
        void saveHex(download);
      } else {
        void downloadActions.start(download);
      }
    },
    [downloadActions, saveHex]
  );

  const project = useStore((s) => s.project);
  const value = useMemo(
    () => ({
      loadFile,
      openEditor,
      project,
      projectEdited,
      resetProject,
      saveHex,
      editorCallbacks: {
        onSave,
        onWorkspaceSave,
        onDownload,
        onBack,
      },
    }),
    [
      loadFile,
      onBack,
      onDownload,
      onSave,
      onWorkspaceSave,
      openEditor,
      project,
      projectEdited,
      resetProject,
      saveHex,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

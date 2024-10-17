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
import { useNavigate } from "react-router";
import { createDataSamplesPageUrl } from "../urls";
import { useLogging } from "../logging/logging-hooks";
import { getTotalNumSamples } from "../utils/gestures";

/**
 * Distinguishes the different ways to trigger the load action.
 */
export type LoadType = "drop-load" | "file-upload";

interface ProjectContext {
  openEditor(): Promise<void>;
  project: Project;
  projectEdited: boolean;
  resetProject: () => void;
  loadFile: (file: File, type: LoadType) => void;
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
  const logging = useLogging();
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
    logging.event({
      type: "edit-in-makecode",
    });
    await doAfterEditorUpdate(() => {
      setEditorOpen(true);
      return Promise.resolve();
    });
  }, [doAfterEditorUpdate, logging, setEditorOpen]);

  const resetProject = useStore((s) => s.resetProject);
  const loadDataset = useStore((s) => s.loadDataset);
  const navigate = useNavigate();
  const loadFile = useCallback(
    async (file: File, type: LoadType): Promise<void> => {
      const fileExtension = getLowercaseFileExtension(file.name);
      logging.event({
        type,
        detail: {
          extension: fileExtension || "none",
        },
      });
      if (fileExtension === "json") {
        const gestureDataString = await readFileAsText(file);
        const gestureData = JSON.parse(gestureDataString) as unknown;
        if (isDatasetUserFileFormat(gestureData)) {
          loadDataset(gestureData);
          navigate(createDataSamplesPageUrl());
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
    [driverRef, loadDataset, logging, navigate]
  );

  const setSave = useStore((s) => s.setSave);
  const save = useStore((s) => s.save);
  const settings = useStore((s) => s.settings);
  const gestures = useStore((s) => s.gestures);
  const saveNextDownloadRef = useRef(false);
  const saveHex = useCallback(
    async (hex?: HexData): Promise<void> => {
      const { step } = save;
      if (settings.showPreSaveHelp && step === SaveStep.None) {
        setSave({ hex, step: SaveStep.PreSaveHelp });
      } else if (
        getCurrentProject().header?.name === "Untitled" &&
        step === SaveStep.None
      ) {
        setSave({ hex, step: SaveStep.ProjectName });
      } else if (!hex) {
        setSave({ hex, step: SaveStep.SaveProgress });
        // This will result in a future call to saveHex with a hex.
        await doAfterEditorUpdate(async () => {
          saveNextDownloadRef.current = true;
          await driverRef.current!.compile();
        });
      } else {
        logging.event({
          type: "hex-save",
          detail: {
            actions: gestures.length,
            samples: getTotalNumSamples(gestures),
          },
        });
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
    },
    [
      doAfterEditorUpdate,
      driverRef,
      gestures,
      getCurrentProject,
      intl,
      logging,
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

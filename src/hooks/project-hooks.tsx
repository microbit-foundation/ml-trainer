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
import { useNavigate } from "react-router";
import { useLogging } from "../logging/logging-hooks";
import {
  HexData,
  isDatasetUserFileFormat,
  PostImportDialogState,
  SaveStep,
  TourId,
} from "../model";
import { defaultProjectName } from "../project-name";
import { useStore } from "../store";
import {
  createCodePageUrl,
  createDataSamplesPageUrl,
  createTestingModelPageUrl,
} from "../urls";
import {
  downloadHex,
  getLowercaseFileExtension,
  readFileAsText,
} from "../utils/fs-util";
import { getTotalNumSamples } from "../utils/actions";
import { useDownloadActions } from "./download-hooks";

class CodeEditorError extends Error {}

/**
 * Distinguishes the different ways to trigger the load action.
 */
export type LoadType = "drop-load" | "file-upload";

interface ProjectContext {
  browserNavigationToEditor(): Promise<boolean>;
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
  const projectEdited = useStore((s) => s.projectEdited);
  const expectChangedHeader = useStore((s) => s.setChangedHeaderExpected);
  const projectFlushedToEditor = useStore((s) => s.projectFlushedToEditor);
  const checkIfProjectNeedsFlush = useStore((s) => s.checkIfProjectNeedsFlush);
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const setPostImportDialogState = useStore((s) => s.setPostImportDialogState);
  const navigate = useNavigate();
  const doAfterEditorUpdatePromise = useRef<Promise<void>>();
  const doAfterEditorUpdate = useCallback(
    async (action: () => Promise<void>) => {
      if (!doAfterEditorUpdatePromise.current && checkIfProjectNeedsFlush()) {
        doAfterEditorUpdatePromise.current = new Promise<void>(
          (resolve, reject) => {
            // driverRef.current is not defined on first render.
            // Only an issue when navigating to code page directly.
            if (!driverRef.current) {
              reject(new CodeEditorError("MakeCode iframe ref is undefined"));
            } else {
              const project = getCurrentProject();
              expectChangedHeader();
              driverRef.current
                .importProject({ project })
                .then(() => {
                  projectFlushedToEditor();
                  resolve();
                })
                .catch((e) => {
                  reject(e);
                });
            }
          }
        );
      }
      try {
        await doAfterEditorUpdatePromise.current;
      } finally {
        doAfterEditorUpdatePromise.current = undefined;
      }
      return action();
    },
    [
      checkIfProjectNeedsFlush,
      getCurrentProject,
      expectChangedHeader,
      driverRef,
      projectFlushedToEditor,
    ]
  );
  const openEditor = useCallback(async () => {
    logging.event({
      type: "edit-in-makecode",
    });
    await doAfterEditorUpdate(() => {
      navigate(createCodePageUrl());
      return Promise.resolve();
    });
  }, [doAfterEditorUpdate, logging, navigate]);
  const browserNavigationToEditor = useCallback(async () => {
    try {
      await doAfterEditorUpdate(() => {
        return Promise.resolve();
      });
      return true;
    } catch (e) {
      if (e instanceof CodeEditorError) {
        // In this case, doAfterEditorUpdate has failed because the app has loaded
        // on the code page directly. The caller of browserNavigationToEditor redirects.
        return false;
      }
      // Unexpected error, can't handle better than the redirect.
      logging.error(e);
      return false;
    }
  }, [doAfterEditorUpdate, logging]);
  const resetProject = useStore((s) => s.resetProject);
  const loadDataset = useStore((s) => s.loadDataset);
  const tourComplete = useStore((s) => s.tourComplete);
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
        const actionsString = await readFileAsText(file);
        const actions = JSON.parse(actionsString) as unknown;
        if (isDatasetUserFileFormat(actions)) {
          loadDataset(actions);
          navigate(createDataSamplesPageUrl());
          tourComplete(TourId.CollectDataToTrainModel);
        } else {
          setPostImportDialogState(PostImportDialogState.Error);
        }
      } else if (fileExtension === "hex") {
        const hex = await readFileAsText(file);
        const makeCodeMagicMark = "41140E2FB82FA2BB";
        // Check if is a MakeCode hex, otherwise show error dialog.
        if (hex.includes(makeCodeMagicMark)) {
          driverRef.current!.importFile({
            filename: file.name,
            parts: [hex],
          });
          tourComplete(TourId.CollectDataToTrainModel);
        } else {
          setPostImportDialogState(PostImportDialogState.Error);
        }
      } else {
        setPostImportDialogState(PostImportDialogState.Error);
      }
    },
    [
      driverRef,
      loadDataset,
      logging,
      navigate,
      setPostImportDialogState,
      tourComplete,
    ]
  );

  const setSave = useStore((s) => s.setSave);
  const save = useStore((s) => s.save);
  const settings = useStore((s) => s.settings);
  const actions = useStore((s) => s.gestures);
  const saveNextDownloadRef = useRef(false);
  const saveHex = useCallback(
    async (hex?: HexData): Promise<void> => {
      const { step } = save;
      if (settings.showPreSaveHelp && step === SaveStep.None) {
        setSave({ hex, step: SaveStep.PreSaveHelp });
      } else if (
        getCurrentProject().header?.name === defaultProjectName &&
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
            actions: actions.length,
            samples: getTotalNumSamples(actions),
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
      actions,
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

  const onBack = useCallback(() => {
    navigate(createTestingModelPageUrl());
  }, [navigate]);
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
      browserNavigationToEditor,
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
      browserNavigationToEditor,
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

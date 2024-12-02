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
} from "../model";
import { untitledProjectName as untitled } from "../project-name";
import { useStore } from "../store";
import {
  createCodePageUrl,
  createDataSamplesPageUrl,
  createTestingModelPageUrl,
} from "../urls";
import { getTotalNumSamples } from "../utils/actions";
import {
  downloadHex,
  getLowercaseFileExtension,
  readFileAsText,
} from "../utils/fs-util";
import { useDownloadActions } from "./download-hooks";
import { usePromiseRef } from "./use-promise-ref";

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
    | "onDownload"
    | "onWorkspaceSave"
    | "onWorkspaceLoaded"
    | "onSave"
    | "onBack"
    | "initialProjects"
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

export const useDefaultProjectName = (): string => {
  const intl = useIntl();
  return intl.formatMessage({ id: "default-project-name" });
};

export const useProjectIsUntitled = (): boolean => {
  const translatedUntitled = useDefaultProjectName();
  const projectName = useStore((s) => s.project.header?.name);
  return projectName === untitled || projectName === translatedUntitled;
};

export const useProjectName = (): string => {
  const isUntitled = useProjectIsUntitled();
  const translatedUntitled = useDefaultProjectName();
  const projectName = useStore((s) =>
    !s.project.header || isUntitled ? translatedUntitled : s.project.header.name
  );
  return projectName;
};

export const ProjectProvider = ({
  driverRef,
  children,
}: ProjectProviderProps) => {
  const intl = useIntl();
  const toast = useToast();
  const logging = useLogging();
  const projectEdited = useStore((s) => s.projectEdited);
  const editorStartUp = useStore((s) => s.editorStartUp);
  const getEditorStartUp = useStore((s) => s.getEditorStartUp);
  const editorReady = useStore((s) => s.editorReady);
  const editorTimedOut = useStore((s) => s.editorTimedOut);
  const openEditorTimedOutDialog = useStore(
    (s) => () => s.setIsEditorTimedOutDialogOpen(true)
  );
  const expectChangedHeader = useStore((s) => s.setChangedHeaderExpected);
  const projectFlushedToEditor = useStore((s) => s.projectFlushedToEditor);
  const checkIfProjectNeedsFlush = useStore((s) => s.checkIfProjectNeedsFlush);
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const setPostImportDialogState = useStore((s) => s.setPostImportDialogState);
  const navigate = useNavigate();

  const project = useStore((s) => s.project);
  const editorReadyPromiseRef = usePromiseRef<void>();
  const initialProjects = useCallback(() => {
    logging.log(
      `[MakeCode] Initialising with header ID: ${project.header?.id}`
    );
    // This is a useful point to introduce a delay to debug MakeCode init dependencies.
    return Promise.resolve([project]);
  }, [logging, project]);

  const startUpTimeout = 90000;
  const startUpTimestamp = useRef<number>(Date.now());

  const onWorkspaceLoaded = useCallback(async () => {
    // Wait another second because it's not really ready at this point.
    await new Promise((res) => setTimeout(res, 1000));
    logging.log("[MakeCode] Workspace loaded");

    // Get latest start up state and only mark editor ready if editor has not timed out.
    getEditorStartUp() !== "timed out" && editorReady();
    editorReadyPromiseRef.current.resolve();
  }, [editorReady, editorReadyPromiseRef, getEditorStartUp, logging]);

  const checkIfEditorStartUpTimedOut = useCallback(
    async (promise: Promise<void> | undefined) => {
      const elapsedTimeSinceStartup = Date.now() - startUpTimestamp.current;
      const remainingTimeout = startUpTimeout - elapsedTimeSinceStartup;
      if (
        // Editor has already timed out.
        (editorStartUp === "in-progress" && remainingTimeout <= 0) ||
        editorStartUp === "timed out"
      ) {
        return true;
      }
      return await Promise.race([
        promise,
        ...(remainingTimeout > 0
          ? [
              new Promise<true>((resolve) =>
                setTimeout(() => {
                  resolve(true);
                }, remainingTimeout)
              ),
            ]
          : []),
      ]);
    },
    [editorStartUp]
  );

  const doAfterEditorUpdatePromise = useRef<Promise<void>>();
  const doAfterEditorUpdate = useCallback(
    async (action: () => Promise<void>) => {
      if (!doAfterEditorUpdatePromise.current && checkIfProjectNeedsFlush()) {
        doAfterEditorUpdatePromise.current = (async () => {
          // driverRef.current is not defined on first render.
          // Only an issue when navigating to code page directly.
          if (!driverRef.current) {
            throw new CodeEditorError("MakeCode iframe ref is undefined");
          } else {
            logging.log("[MakeCode] Importing project");
            await editorReadyPromiseRef.current.promise;
            const project = getCurrentProject();
            expectChangedHeader();
            try {
              await driverRef.current.importProject({ project });
              logging.log("[MakeCode] Project import succeeded");
              projectFlushedToEditor();
            } catch (e) {
              logging.log("[MakeCode] Project import failed");
              throw e;
            }
          }
        })();
      }

      try {
        const hasTimedOut = await checkIfEditorStartUpTimedOut(
          doAfterEditorUpdatePromise.current
        );
        if (hasTimedOut) {
          editorTimedOut();
          logging.log("[MakeCode] Load timed out");
          logging.event({
            type: "makecode-load-failed",
          });
          throw new CodeEditorError("MakeCode load timed out");
        }
      } finally {
        doAfterEditorUpdatePromise.current = undefined;
      }
      return action();
    },
    [
      checkIfProjectNeedsFlush,
      driverRef,
      logging,
      editorReadyPromiseRef,
      getCurrentProject,
      expectChangedHeader,
      projectFlushedToEditor,
      checkIfEditorStartUpTimedOut,
      editorTimedOut,
    ]
  );
  const openEditor = useCallback(async () => {
    logging.event({
      type: "edit-in-makecode",
    });
    try {
      await doAfterEditorUpdate(() => {
        navigate(createCodePageUrl());
        return Promise.resolve();
      });
    } catch (e) {
      if (e instanceof CodeEditorError) {
        openEditorTimedOutDialog();
      }
    }
  }, [doAfterEditorUpdate, logging, navigate, openEditorTimedOutDialog]);
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
        } else {
          setPostImportDialogState(PostImportDialogState.Error);
        }
      } else if (fileExtension === "hex") {
        const hex = await readFileAsText(file);
        const makeCodeMagicMark = "41140E2FB82FA2BB";
        // Check if is a MakeCode hex, otherwise show error dialog.
        if (hex.includes(makeCodeMagicMark)) {
          const hasTimedOut = await checkIfEditorStartUpTimedOut(
            editorReadyPromiseRef.current.promise
          );
          if (hasTimedOut) {
            openEditorTimedOutDialog();
            return;
          }
          // This triggers the code in editorChanged to update actions etc.
          driverRef.current!.importFile({
            filename: file.name,
            parts: [hex],
          });
        } else {
          setPostImportDialogState(PostImportDialogState.Error);
        }
      } else {
        setPostImportDialogState(PostImportDialogState.Error);
      }
    },
    [
      checkIfEditorStartUpTimedOut,
      driverRef,
      editorReadyPromiseRef,
      loadDataset,
      logging,
      navigate,
      openEditorTimedOutDialog,
      setPostImportDialogState,
    ]
  );

  const setSave = useStore((s) => s.setSave);
  const save = useStore((s) => s.save);
  const settings = useStore((s) => s.settings);
  const actions = useStore((s) => s.actions);
  const saveNextDownloadRef = useRef(false);
  const translatedUntitled = useDefaultProjectName();
  const saveHex = useCallback(
    async (hex?: HexData): Promise<void> => {
      const { step } = save;
      const projectName = getCurrentProject().header?.name;
      if (settings.showPreSaveHelp && step === SaveStep.None) {
        setSave({ hex, step: SaveStep.PreSaveHelp });
      } else if (
        (projectName === untitled || projectName === translatedUntitled) &&
        step === SaveStep.None
      ) {
        setSave({ hex, step: SaveStep.ProjectName });
      } else if (!hex) {
        setSave({ hex, step: SaveStep.SaveProgress });
        // This will result in a future call to saveHex with a hex.
        try {
          await doAfterEditorUpdate(async () => {
            saveNextDownloadRef.current = true;
            await driverRef.current!.compile();
          });
        } catch (e) {
          if (e instanceof CodeEditorError) {
            setSave({ step: SaveStep.None });
            openEditorTimedOutDialog();
          }
        }
      } else {
        logging.event({
          type: "hex-save",
          detail: {
            actions: actions.length,
            samples: getTotalNumSamples(actions),
          },
        });
        downloadHex(hex);
        setSave({ step: SaveStep.None });
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
      save,
      getCurrentProject,
      settings.showPreSaveHelp,
      translatedUntitled,
      setSave,
      doAfterEditorUpdate,
      driverRef,
      openEditorTimedOutDialog,
      logging,
      actions,
      toast,
      intl,
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
        initialProjects,
        onSave,
        onWorkspaceSave,
        onDownload,
        onBack,
        onWorkspaceLoaded,
      },
    }),
    [
      loadFile,
      openEditor,
      browserNavigationToEditor,
      project,
      projectEdited,
      resetProject,
      saveHex,
      initialProjects,
      onSave,
      onWorkspaceSave,
      onDownload,
      onBack,
      onWorkspaceLoaded,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

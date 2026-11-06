/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import { ProgressStage } from "@microbit/microbit-connection";
import { DeviceBondState } from "@microbit/microbit-connection/bluetooth";
import { v4 as uuid } from "uuid";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  broadcastChannel,
  BroadcastChannelData,
  BroadcastChannelMessageType,
} from "./broadcast-channel";
import { BufferedData } from "./buffered-data";
import {
  DataConnectionState,
  DataConnectionType,
  getInitialDataConnectionState,
} from "./data-connection-flow";
import { deployment } from "./deployment";
import {
  DownloadState,
  DownloadStep,
  SameOrDifferentChoice,
} from "./download-flow/download-types";
import { flags } from "./flags";
import { getHint } from "./hints";
import { LoadAction } from "./hooks/project-hooks";
import { createPromise, PromiseInfo } from "./hooks/use-promise-ref";
import { Logging } from "./logging/logging";
import {
  filenames,
  generateCustomFiles,
  generateProject,
} from "./makecode/utils";
import { applyFilters, Confidences } from "./ml";
import { mlWorker } from "./ml-worker-client";
import { mlSettings } from "./mlConfig";
import { trainModel } from "./train-model";
import {
  Action,
  ActionData,
  DataSamplesPageHint,
  DataSamplesView,
  EditorStartUp,
  OldActionData,
  PostImportDialogState,
  RecordingData,
  SaveState,
  SaveStep,
  SaveType,
  tourSequence,
  TourState,
  TourTrigger,
  TourTriggerName,
  TrainedModel,
  TrainModelDialogStage,
} from "./model";
import { isNativePlatform } from "./platform";
import {
  createUntitledProject,
  currentDataWindow,
  DataWindow,
  legacyDataWindow,
  migrateLegacyActionDataAndAssignNewIds,
  renameProject,
  untitledProjectName,
} from "./project-utils";
import { projectSessionStorage } from "./session-storage";
import { defaultSettings, Settings } from "./settings";
import { SqliteDatabase } from "./sqlite-storage";
import { Database, IdbDatabase, ProjectDataWithActions } from "./storage";
import { getTour as getTourSpec } from "./tours";
import { getTotalNumSamples } from "./utils/actions";
import { downloadDataString } from "./utils/fs-util";
import { defaultIcons, MakeCodeIcon } from "./utils/icons";
import { getDetectedAction } from "./utils/prediction";

// Use Capacitor.isNativePlatform() directly rather than the isNativePlatform()
// helper (which also respects the ios/android flags) because the Capacitor
// SQLite plugin is only available on actual native platforms.
const storage: Database = Capacitor.isNativePlatform()
  ? new SqliteDatabase()
  : new IdbDatabase();

const createFirstAction = (): ActionData => ({
  icon: defaultIcons[0],
  id: uuid(),
  name: "",
  recordings: [],
  createdAt: Date.now(),
});

interface PredictionResult {
  confidences: Confidences;
  detected: Action | undefined;
}

const updateProject = (
  project: MakeCodeProject,
  projectEdited: boolean,
  actions: ActionData[],
  model: TrainedModel | undefined,
  dataWindow: DataWindow
): Pick<Store, "project" | "projectEdited" | "appEditNeedsFlushToEditor"> => {
  const actionsData = { data: actions };
  const updatedProject = {
    ...project,
    text: {
      ...project.text,
      ...(projectEdited
        ? generateCustomFiles(
            actionsData,
            model,
            dataWindow,
            projectEdited,
            project
          )
        : generateProject(
            project.header?.name ?? untitledProjectName,
            actionsData,
            model,
            dataWindow,
            projectEdited
          ).text),
    },
  };
  return {
    project: updatedProject,
    projectEdited,
    appEditNeedsFlushToEditor: true,
  };
};

export interface StorageErrorEvent {
  type: "quota" | "other";
  kind: "browser" | "device";
}

export interface State {
  storageError: StorageErrorEvent | undefined;
  id: string | undefined;
  actions: ActionData[];
  dataWindow: DataWindow;
  model: TrainedModel | undefined;

  timestamp: number;

  /**
   * Hint to trigger depending on actions.
   */
  hint: DataSamplesPageHint;
  /**
   * Set to true if user has moved the micro:bit.
   * This is used to decide whether to show the move hint.
   */
  hasMoved: boolean;
  isRecording: boolean;

  project: MakeCodeProject;
  /**
   * We use this for the UI to tell when we've switched new project,
   * e.g. to show a toast.
   */
  projectLoadTimestamp: number;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;
  /**
   * Set to true when we need to update MakeCode before we open it.
   */
  appEditNeedsFlushToEditor: boolean;
  isEditorOpen: boolean;
  isEditorReady: boolean;
  /**
   * Whether we're expecting an editorChange call with a new header id
   * because we've loaded a new hex file.
   *
   * In this case we need to update app state from the project.
   */
  isEditorLoadingFile: boolean;
  /**
   * Whether we're expecting a editorChange call with a new header id
   * because we've imported an updated copy of the project.
   *
   * In this case app state (e.g. dataset) will already be in sync.
   */
  isEditorImportingState: boolean;
  editorStartUp: EditorStartUp;
  editorStartUpTimestamp: number;
  editorPromises: {
    editorReadyPromise: PromiseInfo<void>;
    editorContentLoadedPromise: PromiseInfo<void>;
  };
  isEditorTimedOutDialogOpen: boolean;
  isLoadingOverlayVisible: boolean;
  langChanged: boolean;

  download: DownloadState;
  downloadFlashingProgress: {
    stage: ProgressStage | undefined;
    value: number | undefined;
  };
  dataConnection: DataConnectionState;
  deviceBondState: DeviceBondState;
  dataConnectionFlashingProgress: {
    stage: ProgressStage | undefined;
    value: number | undefined;
  };
  save: SaveState;

  settings: Settings;
  /**
   * `true` once `loadSettingsFromStorage` has resolved. Lets surfaces
   * that branch on a settings field (e.g. the analytics consent
   * provider on first run) wait until the persisted decision is
   * actually known, rather than acting on the default.
   */
  settingsLoaded: boolean;

  trainModelProgress: number;
  trainModelDialogStage: TrainModelDialogStage;

  tourState?: TourState;
  postConnectTourTrigger?: TourTrigger;
  postImportDialogState: PostImportDialogState;

  predictionInterval: ReturnType<typeof setInterval> | undefined;
  predictionResult: PredictionResult | undefined;

  isLanguageDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isConnectFirstDialogOpen: boolean;
  isAboutDialogOpen: boolean;
  isFeedbackFormOpen: boolean;
  isDeleteAllActionsDialogOpen: boolean;
  isDeleteActionDialogOpen: boolean;
  isIncompatibleEditorDeviceDialogOpen: boolean;
  isNameProjectDialogOpen: boolean;
  isRecordingDialogOpen: boolean;
  isConnectToRecordDialogOpen: boolean;
  isWelcomeDialogOpen: boolean;

  welcomeDialogDismissedForProject: string | undefined;

  allProjectData: ProjectDataWithActions[];
}

export interface Actions {
  getAllProjectData(): Promise<void>;
  loadProjectFromStorage(id: string): Promise<void>;
  updateProjectUpdatedAt(): Promise<void>;
  duplicateProject(id: string, name: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  deleteProjects(ids: string[]): Promise<void>;
  clearProjectState(): void;
  addNewAction(): Promise<void>;
  addActionRecording(id: string, recording: RecordingData): Promise<void>;
  deleteAction(action: ActionData): Promise<void>;
  setActionName(id: string, name: string): Promise<void>;
  setActionIcon(id: string, icon: MakeCodeIcon): Promise<void>;
  setRequiredConfidence(id: string, value: number): Promise<void>;
  deleteActionRecording(id: string, recordingId: string): Promise<void>;
  deleteAllActions(): Promise<void>;
  downloadDataset(): Promise<void>;

  dataCollectionMicrobitConnected(): void;

  loadDataset(actions: ActionData[], loadAction: LoadAction): Promise<void>;
  loadProject(project: MakeCodeProject, name: string): Promise<void>;
  setEditorOpen(open: boolean): void;
  setHint(suppressTrainAndAddActionHint?: boolean): void;
  setHasMoved(hasMoved: boolean): void;
  recordingStarted(): void;
  recordingStopped(): void;
  newSession(projectName?: string): Promise<void>;
  trainModelFlowStart: (callback?: () => void) => Promise<void>;
  closeTrainModelDialogs: () => void;
  trainModel(): Promise<boolean>;
  removeModel(): void;
  setSettings(update: Partial<Settings>): Promise<void>;
  setLanguage(languageId: string): Promise<void>;

  /**
   * Resets the project.
   */
  resetProject(): Promise<void>;
  /**
   * Sets the project name.
   * Unless projectId is specified, the opened project id will be used.
   */
  setProjectName(name: string, projectId?: string): Promise<void>;
  setProjectEdited(): void;
  /**
   * When interacting outside of React to sync with MakeCode it's important to have
   * the current project after state changes.
   */
  getCurrentProject(): MakeCodeProject;
  checkIfProjectNeedsFlush(): boolean;
  checkIfLangChanged(): boolean;
  langChangeFlushedToEditor(): void;
  editorChange(project: MakeCodeProject): Promise<void>;
  editorReady(): void;
  editorTimedOut(): void;
  getEditorStartUp(): EditorStartUp;
  setIsEditorTimedOutDialogOpen(isOpen: boolean): void;
  setEditorLoadingFile(): void;
  setEditorImportingState(): void;
  projectFlushedToEditor(): void;

  setDownload(state: DownloadState): void;
  setDownloadFlashingProgress(
    stage: ProgressStage,
    value: number | undefined
  ): void;
  setDataConnection(state: DataConnectionState): void;
  setDataConnectionType(type: DataConnectionType): void;
  setDataConnectionFlashingProgress(
    stage: ProgressStage,
    value: number | undefined
  ): void;
  setSave(state: SaveState): void;

  tourStart(trigger: TourTrigger, manual?: boolean): Promise<void>;
  tourNext(): void;
  tourBack(): void;
  tourComplete(markCompleted: TourTriggerName[]): Promise<void>;

  setPostConnectTourTrigger(trigger: TourTrigger | undefined): void;

  setDataSamplesView(view: DataSamplesView): Promise<void>;
  setShowGraphs(show: boolean): Promise<void>;

  setPostImportDialogState(state: PostImportDialogState): void;
  startPredicting(buffer: BufferedData): void;
  stopPredicting(): void;

  setLoadingOverlayVisible(visible: boolean): void;

  languageDialogOnOpen(): void;
  settingsDialogOnOpen(): void;
  connectFirstDialogOnOpen(): void;
  aboutDialogOnOpen(): void;
  feedbackFormOnOpen(): void;
  nameProjectDialogOnOpen(): void;
  deleteAllActionsDialogOnOpen(): void;
  deleteActionDialogOnOpen(): void;
  incompatibleEditorDeviceDialogOnOpen(): void;
  recordingDialogOnOpen(): void;
  connectToRecordDialogOnOpen(): void;
  dismissWelcomeDialog(): void;
  resetWelcomeDialog(): void;
  closeDialog(): void;
  isNonConnectionDialogOpen(): boolean;
}

type Store = State & Actions;

/**
 * Whether a closeable (simple, non-flow) dialog is currently open.
 *
 * Used by the Android back button handler to decide whether to dismiss a
 * dialog via {@link closeDialog}. Must stay in sync with {@link closeDialog}.
 *
 * Excludes non-closeable operations (recording, training, saving) which
 * swallow back navigation, and connection/download flows which have their
 * own back/close logic.
 */
export const isCloseableDialogOpen = (state: State): boolean =>
  state.isAboutDialogOpen ||
  state.isSettingsDialogOpen ||
  state.isConnectFirstDialogOpen ||
  state.isLanguageDialogOpen ||
  state.isFeedbackFormOpen ||
  state.isDeleteAllActionsDialogOpen ||
  state.isNameProjectDialogOpen ||
  state.isConnectToRecordDialogOpen ||
  state.isDeleteActionDialogOpen ||
  state.isIncompatibleEditorDeviceDialogOpen ||
  state.isWelcomeDialogOpen ||
  state.isEditorTimedOutDialogOpen ||
  state.postImportDialogState !== PostImportDialogState.None ||
  (state.trainModelDialogStage !== TrainModelDialogStage.Closed &&
    state.trainModelDialogStage !== TrainModelDialogStage.TrainingInProgress) ||
  (state.save.step !== SaveStep.None &&
    state.save.step !== SaveStep.SaveProgress);

const createMlStore = (logging: Logging) => {
  return create<Store>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        storageError: undefined,
        id: undefined,
        timestamp: 0,
        actions: [createFirstAction()],
        dataWindow: currentDataWindow,
        hint: null,
        hasMoved: false,
        isRecording: false,
        project: createUntitledProject(),
        projectLoadTimestamp: 0,
        download: {
          step: DownloadStep.None,
          microbitChoice: SameOrDifferentChoice.Default,
          pairingMethod: "triple-reset",
          isCheckingPermissions: false,
          connectionAbortController: undefined,
          // This value will be replaced by persisted name before it is used.
          bluetoothMicrobitName: undefined,
        },
        downloadFlashingProgress: { stage: undefined, value: undefined },
        dataConnection: getInitialDataConnectionState(),
        deviceBondState: {
          setBonded(id: string, isBonded: boolean) {
            const { settings } = get();
            const current = settings.bondedDevices ?? [];
            const bondedDevices = isBonded
              ? current.includes(id)
                ? current
                : [...current, id]
              : current.filter((d) => d !== id);
            set({
              settings: { ...settings, bondedDevices },
            });
            // Persist to IndexedDB via setSettings (fire-and-forget).
            void get().setSettings({ bondedDevices });
          },
          isBonded(id: string) {
            return get().settings.bondedDevices?.includes(id) ?? false;
          },
        },
        dataConnectionFlashingProgress: {
          stage: undefined,
          value: undefined,
        },
        save: {
          step: SaveStep.None,
          type: SaveType.Download,
        },
        projectEdited: false,
        settings: defaultSettings,
        settingsLoaded: false,
        model: undefined,
        isEditorOpen: false,
        isEditorReady: false,
        isEditorLoadingFile: false,
        isEditorImportingState: false,
        editorStartUp: "in-progress",
        editorStartUpTimestamp: Date.now(),
        editorPromises: {
          editorReadyPromise: createPromise<void>(),
          editorContentLoadedPromise: createPromise<void>(),
        },
        isEditorTimedOutDialogOpen: false,
        langChanged: false,
        appEditNeedsFlushToEditor: true,
        isLoadingOverlayVisible: false,
        // This dialog flow spans two pages
        trainModelDialogStage: TrainModelDialogStage.Closed,
        trainModelProgress: 0,
        dataSamplesView: DataSamplesView.Graph,
        postImportDialogState: PostImportDialogState.None,
        predictionInterval: undefined,
        predictionResult: undefined,
        isLanguageDialogOpen: false,
        isSettingsDialogOpen: false,
        isConnectFirstDialogOpen: false,
        isAboutDialogOpen: false,
        isFeedbackFormOpen: false,
        isDeleteAllActionsDialogOpen: false,
        isNameProjectDialogOpen: false,
        isRecordingDialogOpen: false,
        isConnectToRecordDialogOpen: false,
        isDeleteActionDialogOpen: false,
        isIncompatibleEditorDeviceDialogOpen: false,
        isWelcomeDialogOpen: false,

        welcomeDialogDismissedForProject: undefined,

        allProjectData: [],

        async setSettings(update: Partial<Settings>) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            ...update,
          };
          const timestamp = Date.now();
          set({ settings: updatedSettings, timestamp }, false, "setSettings");
          await storageWriteWithErrHandling(
            () => storage.updateSettings(updatedSettings),
            "settings"
          );
        },

        async setLanguage(languageId: string) {
          const { settings } = get();
          if (languageId === settings.languageId) {
            // No need to update language if language is the same.
            // MakeCode does not reload.
            return;
          }
          const updatedSettings = {
            ...settings,
            languageId,
          };
          const timestamp = Date.now();
          set(
            {
              settings: updatedSettings,
              editorPromises: {
                editorReadyPromise: createPromise<void>(),
                editorContentLoadedPromise: createPromise<void>(),
              },
              isEditorReady: false,
              editorStartUp: "in-progress",
              editorStartUpTimestamp: Date.now(),
              langChanged: true,
              timestamp,
            },
            false,
            "setLanguage"
          );
          await storageWriteWithErrHandling(
            () => storage.updateSettings(updatedSettings),
            "settings"
          );
        },

        async newSession(projectName?: string) {
          const untitledProject = createUntitledProject();
          const timestamp = Date.now();
          const projectEdited = false;
          const newProject = projectName
            ? renameProject(untitledProject, projectName)
            : untitledProject;
          const id = uuid();
          const actions = [createFirstAction()];
          set(
            {
              id,
              actions,
              dataWindow: currentDataWindow,
              model: undefined,
              project: newProject,
              projectEdited,
              appEditNeedsFlushToEditor: true,
              timestamp,
              hint: getHint(actions, false),
            },
            false,
            "newSession"
          );
          projectSessionStorage.setProjectId(id);
          await storageWriteWithErrHandling(() =>
            storage.newSession(
              actions,
              {
                project: newProject,
                projectEdited,
              },
              { timestamp, name: projectName ?? untitledProjectName, id }
            )
          );
        },

        setEditorOpen(open: boolean) {
          set(
            ({ download }) => ({
              isEditorOpen: open,
              download: {
                ...download,
                connection: undefined,
              },
            }),
            false,
            "setEditorOpen"
          );
        },

        setHint(suppressTrainAndAddActionHint = false) {
          set(
            ({ actions, model }) => {
              // Don't hint to train when a model already exists, e.g. after
              // renaming an action which doesn't invalidate the trained model.
              const hint = getHint(
                actions,
                suppressTrainAndAddActionHint || model !== undefined
              );
              return { hint };
            },
            false,
            "setHint"
          );
        },

        setHasMoved(hasMoved) {
          set({ hasMoved }, false, "setHasMoved");
        },

        recordingStarted() {
          set({ isRecording: true }, false, "recordingStarted");
        },
        recordingStopped() {
          set({ isRecording: false }, false, "recordingStopped");
        },

        async loadProjectFromStorage(id: string) {
          const persistedData = await storageWithErrHandling(
            () => storage.getProject(id),
            false
          );
          projectSessionStorage.setProjectId(id);
          set({
            // Get data window from actions on app load.
            dataWindow: getDataWindowFromActions(persistedData.actions),
            appEditNeedsFlushToEditor: true,
            isEditorOpen: false,
            ...persistedData,
          });
        },

        async getAllProjectData(): Promise<void> {
          const allProjectData = await storageWithErrHandling(
            () => storage.getAllProjectData(),
            false
          );
          set({
            allProjectData,
          });
        },

        async updateProjectUpdatedAt() {
          const { id } = get();
          await storageWriteWithErrHandling(() =>
            storage.updateProjectTimestamp(id, Date.now())
          );
        },

        async duplicateProject(id: string, name: string) {
          const { allProjectData } = get();
          const duplicatedProject = allProjectData.find((p) => p.id === id);
          const newProjectId = uuid();
          const timestamp = Date.now();
          if (duplicatedProject) {
            set({
              allProjectData: [
                ...allProjectData,
                { ...duplicatedProject, name, id: newProjectId, timestamp },
              ],
            });
            await storageWriteWithErrHandling(() =>
              storage.duplicateProject(id, {
                id: newProjectId,
                name,
                timestamp,
              })
            );
          }
        },

        async deleteProject(id: string) {
          const { id: currentProjectId, allProjectData } = get();
          set({
            ...(() => {
              if (id === currentProjectId) {
                // You have deleted the currently open project.
                return {
                  id: undefined,
                  actions: [],
                  dataWindow: currentDataWindow,
                  model: undefined,
                  project: createUntitledProject(),
                  projectEdited: false,
                  appEditNeedsFlushToEditor: true,
                  timestamp: undefined,
                };
              }
              return {};
            })(),
            allProjectData: allProjectData.filter((p) => p.id !== id),
          });
          if (id === currentProjectId) {
            projectSessionStorage.clearProjectId();
          }
          await storageWriteWithErrHandling(
            () => storage.deleteProject(id),
            false
          );
          const message: BroadcastChannelData = {
            messageType: BroadcastChannelMessageType.DELETE_PROJECT,
            projectIds: [id],
          };
          broadcastChannel.postMessage(message);
        },

        async deleteProjects(ids: string[]) {
          const { id: currentProjectId, allProjectData } = get();
          set({
            ...(() => {
              if (currentProjectId && ids.includes(currentProjectId)) {
                // You have deleted the currently open project.
                return {
                  id: undefined,
                  actions: [],
                  dataWindow: currentDataWindow,
                  model: undefined,
                  project: createUntitledProject(),
                  projectEdited: false,
                  appEditNeedsFlushToEditor: true,
                  timestamp: undefined,
                };
              }
              return {};
            })(),
            allProjectData: allProjectData.filter((p) => !ids.includes(p.id)),
          });
          if (currentProjectId && ids.includes(currentProjectId)) {
            projectSessionStorage.clearProjectId();
          }
          await storageWriteWithErrHandling(
            () => storage.deleteProjects(ids),
            false
          );
          const message: BroadcastChannelData = {
            messageType: BroadcastChannelMessageType.DELETE_PROJECT,
            projectIds: ids,
          };
          broadcastChannel.postMessage(message);
        },

        clearProjectState() {
          const untitledProject = createUntitledProject();
          set({
            id: undefined,
            actions: [],
            dataWindow: currentDataWindow,
            model: undefined,
            project: untitledProject,
            projectEdited: false,
            appEditNeedsFlushToEditor: true,
            timestamp: undefined,
          });
          projectSessionStorage.clearProjectId();
        },

        async addNewAction() {
          const { actions, dataWindow, id, project, projectEdited } = get();
          logging.event({ type: "action_create" });
          const newAction: ActionData = {
            icon: actionIcon({
              isFirstAction: actions.length === 0,
              existingActions: actions,
            }),
            id: uuid(),
            name: "",
            recordings: [],
            createdAt: Date.now(),
          };
          const updatedActions = [...actions, newAction];
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            dataWindow
          );
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            hint: getHint(updatedActions, false),
            model: undefined,
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.addAction(
              id,
              newAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async addActionRecording(actionId: string, recording: RecordingData) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          const action = actions.find((a) => a.id === actionId);
          if (!action) {
            return;
          }
          const updatedAction = {
            ...action,
            recordings: [recording, ...action.recordings],
          };
          const updatedActions = actions.map((a) =>
            a.id === actionId ? updatedAction : a
          );
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            dataWindow
          );
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            hint: getHint(updatedActions, false),
            model: undefined,
            timestamp,

            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.addRecording(
              id,
              recording,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteAction(action: ActionData) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          const remainingActions = actions.filter((a) => a.id !== action.id);
          const newActions =
            remainingActions.length === 0
              ? [createFirstAction()]
              : remainingActions;
          const newDataWindow =
            remainingActions.length === 0 ? currentDataWindow : dataWindow;
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            undefined,
            newDataWindow
          );
          const timestamp = Date.now();
          set({
            actions: newActions,
            hint: getHint(newActions, false),
            dataWindow: newDataWindow,
            model: undefined,
            hasMoved: true,
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.deleteAction(
              id,
              action,
              remainingActions.length === 0 ? newActions : [],
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setActionName(actionId: string, name: string) {
          const {
            actions,
            dataWindow,
            hint,
            id,
            project,
            projectEdited,
            model,
          } = get();
          const action = actions.find((a) => a.id === actionId);
          if (!action) {
            return;
          }
          const updatedAction = { ...action, name };
          const newActions = actions.map((a) =>
            a.id === actionId ? updatedAction : a
          );
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          const timestamp = Date.now();
          // Don't hint to train when a model already exists, e.g. after
          // renaming an action which doesn't invalidate the trained model.
          const newHint = getHint(newActions, model !== undefined);
          set({
            actions: newActions,
            // Hint is set separately in DataSamplesPage.tsx and debounced
            // to avoid aria-live interruptions. Hint is set to null when
            // the hint will change to avoid showing incorrect hint.
            ...(hint === newHint ? {} : { hint: null }),
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.updateAction(
              id,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setActionIcon(actionId: string, icon: MakeCodeIcon) {
          const { actions, dataWindow, id, project, projectEdited, model } =
            get();
          const updatedActions: ActionData[] = [];
          // If we're changing the action to use an icon that's already in use
          // then we update the action that's using the icon to use the action's current icon
          const currentIcon = actions.find((a) => a.id === actionId)?.icon;
          const newActions = actions.map((action) => {
            if (action.id === actionId) {
              const updatedAction = { ...action, icon };
              updatedActions.push(updatedAction);
              return updatedAction;
            } else if (
              action.id !== actionId &&
              action.icon === icon &&
              currentIcon
            ) {
              const updatedAction = { ...action, icon: currentIcon };
              updatedActions.push(updatedAction);
              return updatedAction;
            }
            return action;
          });
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          const timestamp = Date.now();
          set({
            actions: newActions,
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.updateActions(
              id,
              updatedActions,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async setRequiredConfidence(actionId: string, value: number) {
          const { actions, dataWindow, id, project, projectEdited, model } =
            get();
          const action = actions.find((a) => a.id === actionId);
          if (!action) {
            return;
          }
          const updatedAction = { ...action, requiredConfidence: value };
          const newActions = actions.map((a) =>
            a.id === actionId ? updatedAction : a
          );
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActions,
            model,
            dataWindow
          );
          const timestamp = Date.now();
          set({
            actions: newActions,
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.updateAction(
              id,
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteActionRecording(actionId: string, recordingId: string) {
          const { actions, dataWindow, id, project, projectEdited } = get();
          const action = actions.find((a) => a.id === actionId);
          if (!action) {
            return;
          }
          const updatedAction = {
            ...action,
            recordings: action.recordings.filter(
              (recording) => recording.id !== recordingId
            ),
          };
          const updatedActions = actions.map((a) =>
            a.id === actionId ? updatedAction : a
          );
          const numRecordings = updatedActions.reduce(
            (acc, curr) => acc + curr.recordings.length,
            0
          );
          const newDataWindow =
            numRecordings === 0 ? currentDataWindow : dataWindow;
          const updatedProject = updateProject(
            project,
            projectEdited,
            updatedActions,
            undefined,
            newDataWindow
          );
          const timestamp = Date.now();
          set({
            actions: updatedActions,
            hint: getHint(updatedActions, false),
            dataWindow: newDataWindow,
            model: undefined,
            hasMoved: true,
            timestamp,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.deleteRecording(
              id,
              recordingId.toString(),
              updatedAction,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        async deleteAllActions() {
          const { id, project, projectEdited } = get();
          const actions = [createFirstAction()];
          const updatedProject = updateProject(
            project,
            projectEdited,
            actions,
            undefined,
            currentDataWindow
          );
          const timestamp = Date.now();
          set({
            actions,
            hint: getHint(actions, false),
            dataWindow: currentDataWindow,
            model: undefined,
            hasMoved: true,
            ...updatedProject,
          });
          await storageWriteWithErrHandling(() =>
            storage.deleteAllActions(
              id,
              actions,
              {
                project: updatedProject.project,
                projectEdited: updatedProject.projectEdited,
              },
              timestamp
            )
          );
        },

        setLoadingOverlayVisible(visible: boolean) {
          set({ isLoadingOverlayVisible: visible });
        },

        async downloadDataset() {
          const { actions, project } = get();
          const name = project.header?.name ?? untitledProjectName;
          await downloadDataString(
            JSON.stringify(actions, null, 2),
            `${name}-data-samples.json`,
            "application/json",
            `Share ${name} data samples`
          );
        },

        async loadDataset(
          datasetActions: ActionData[],
          loadAction: LoadAction
        ) {
          const { id, settings, project, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          const newActionsWithIcons =
            datasetActions.length > 0
              ? migrateLegacyActionDataAndAssignNewIds(datasetActions)
              : [createFirstAction()];
          // Older datasets did not have icons. Add icons to actions where these are missing.
          newActionsWithIcons.forEach((a) => {
            if (!a.icon) {
              a.icon = actionIcon({
                isFirstAction: false,
                existingActions: newActionsWithIcons,
              });
            }
          });
          const timestamp = Date.now();
          const dataWindow = getDataWindowFromActions(newActionsWithIcons);
          const updatedProject = updateProject(
            project,
            projectEdited,
            newActionsWithIcons,
            undefined,
            dataWindow
          );
          if (loadAction === "replaceActions") {
            set({
              settings: updatedSettings,
              actions: newActionsWithIcons,
              dataWindow,
              model: undefined,
              timestamp,
              hint: getHint(newActionsWithIcons, true),
              ...updatedProject,
            });
            await storageWriteWithErrHandling(() =>
              storage.replaceActions(
                newActionsWithIcons,
                {
                  project: updatedProject.project,
                  projectEdited: updatedProject.projectEdited,
                },
                {
                  timestamp,
                  id,
                }
              )
            );
            await storageWriteWithErrHandling(() =>
              storage.updateSettings(updatedSettings)
            );
          } else if (loadAction === "replaceProject") {
            const newId = uuid();
            set({
              id: newId,
              settings: updatedSettings,
              actions: newActionsWithIcons,
              dataWindow,
              model: undefined,
              timestamp,
              hint: getHint(newActionsWithIcons, true),
              ...updatedProject,
            });
            projectSessionStorage.setProjectId(newId);
            await storageWriteWithErrHandling(() =>
              storage.importProject(
                newActionsWithIcons,
                {
                  project: updatedProject.project,
                  projectEdited: updatedProject.projectEdited,
                },
                {
                  timestamp,
                  id: newId,
                }
              )
            );
            await storageWriteWithErrHandling(() =>
              storage.updateSettings(updatedSettings)
            );
          }
        },

        /**
         * Generally project loads go via MakeCode as it reads the hex but when we open projects
         * from microbit.org we have the JSON already and use this route.
         */
        async loadProject(project: MakeCodeProject, name: string) {
          const { settings } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          const projectActions = getActionsFromProject(project);
          const newActions =
            projectActions.length > 0 ? projectActions : [createFirstAction()];
          const id = uuid();
          const timestamp = Date.now();
          const projectEdited = true;
          set(({ project: prevProject }) => {
            project = renameProject(project, name);
            project = {
              ...project,
              header: {
                ...project.header!,
                // .org projects have a partial header with no id which causes MakeCode sadness
                id: project.header?.id ?? prevProject.header!.id,
              },
            };
            return {
              id,
              settings: updatedSettings,
              actions: newActions,
              dataWindow: getDataWindowFromActions(newActions),
              hint: getHint(newActions, true),
              model: undefined,
              project,
              projectEdited,
              appEditNeedsFlushToEditor: true,
              timestamp,
              // We don't update projectLoadTimestamp here as we don't want a toast notification for .org import
            };
          });
          projectSessionStorage.setProjectId(id);
          await storageWriteWithErrHandling(() =>
            storage.importProject(
              newActions,
              { project, projectEdited },
              { timestamp, id }
            )
          );
          await storageWriteWithErrHandling(() =>
            storage.updateSettings(updatedSettings)
          );
        },

        closeTrainModelDialogs() {
          set({
            trainModelDialogStage: TrainModelDialogStage.Closed,
          });
        },

        async trainModelFlowStart(callback?: () => void) {
          const {
            settings: { showPreTrainHelp },
            actions,
            trainModel,
          } = get();
          if (!hasSufficientDataForTraining(actions)) {
            set({
              trainModelDialogStage: TrainModelDialogStage.InsufficientData,
            });
          } else if (showPreTrainHelp) {
            set({
              trainModelDialogStage: TrainModelDialogStage.Help,
            });
          } else {
            const success = await trainModel();
            // On failure, the stage is already TrainingError, so leave that
            // dialog up rather than navigating away and closing it.
            if (success) {
              callback?.();
              // Push the trainModelDialogStage change to the back of the event queue so it happens
              // after navigation changes.
              setTimeout(
                () =>
                  set({ trainModelDialogStage: TrainModelDialogStage.Closed }),
                0
              );
            }
          }
        },

        async trainModel() {
          const { actions, dataWindow, id, project, projectEdited } = get();
          logging.event({
            type: "model_train",
            detail: {
              actions: actions.length,
              samples: getTotalNumSamples(actions),
            },
          });
          const actionName = "trainModel";
          set({
            trainModelDialogStage: TrainModelDialogStage.TrainingInProgress,
            trainModelProgress: 0,
          });
          try {
            const trainingResult = await trainModel(
              actions,
              dataWindow,
              (trainModelProgress) =>
                set({ trainModelProgress }, false, "trainModelProgress")
            );
            if (trainingResult.error) {
              logging.error(
                "Model training failed",
                new Error(`Model training failed: ${trainingResult.reason}`)
              );
            }
            const model = trainingResult.error
              ? undefined
              : trainingResult.model;
            const updatedProject = updateProject(
              project,
              projectEdited,
              actions,
              model,
              dataWindow
            );
            const timestamp = Date.now();
            set(
              {
                model,
                trainModelDialogStage: model
                  ? TrainModelDialogStage.TrainingInProgress
                  : TrainModelDialogStage.TrainingError,
                timestamp,
                ...updatedProject,
              },
              false,
              actionName
            );
            await storageWriteWithErrHandling(() =>
              storage.updateMakeCodeProject(
                id,
                {
                  project: updatedProject.project,
                  projectEdited: updatedProject.projectEdited,
                },
                timestamp
              )
            );
            return !trainingResult.error;
          } catch (e) {
            logging.error("Model training failed", e);
            set({ trainModelDialogStage: TrainModelDialogStage.TrainingError });
            return false;
          }
        },

        removeModel(): void {
          set({
            model: undefined,
          });
        },

        async resetProject(): Promise<void> {
          const {
            project: previousProject,
            actions,
            id,
            model,
            dataWindow,
          } = get();
          const newProject = {
            ...previousProject,
            text: {
              ...previousProject.text,
              ...generateProject(
                previousProject.header?.name ?? untitledProjectName,
                { data: actions },
                model,
                dataWindow,
                false
              ).text,
            },
          };
          const timestamp = Date.now();
          set(
            {
              project: newProject,
              projectEdited: false,
              appEditNeedsFlushToEditor: true,
              timestamp,
            },
            false,
            "resetProject"
          );
          await storageWriteWithErrHandling(() =>
            storage.updateMakeCodeProject(
              id,
              {
                project: newProject,
                projectEdited: false,
              },
              timestamp
            )
          );
        },

        async setProjectName(name: string, projectId?: string): Promise<void> {
          const {
            id: openedProjectId,
            project: openedProject,
            allProjectData,
          } = get();
          const id = projectId ?? openedProjectId;
          if (id === undefined) {
            throw new Error("No project id");
          }
          const timestamp = Date.now();
          set(
            {
              allProjectData: allProjectData.map((p) =>
                p.id === id ? { ...p, name, timestamp } : p
              ),
              // Rename currently opened project.
              ...(openedProjectId === id
                ? {
                    appEditNeedsFlushToEditor: true,
                    project: renameProject(openedProject, name),
                    timestamp,
                  }
                : {}),
            },
            false,
            "setProjectName"
          );
          await storageWriteWithErrHandling(() =>
            storage.renameProject(id, name, timestamp)
          );
        },

        setProjectEdited() {
          return set(
            ({
              actions,
              dataWindow,
              model,
              project,
              projectEdited: prevProjectEdited,
            }) => {
              if (prevProjectEdited) {
                return {};
              }
              const projectEdited = true;
              return {
                ...updateProject(
                  project,
                  projectEdited,
                  actions,
                  model,
                  dataWindow
                ),
                projectEdited,
              };
            },
            false,
            "setProjectEdited"
          );
        },

        checkIfProjectNeedsFlush() {
          return get().appEditNeedsFlushToEditor;
        },

        checkIfLangChanged() {
          return get().langChanged;
        },

        getCurrentProject() {
          return get().project;
        },

        editorReady() {
          set(
            { isEditorReady: true, editorStartUp: "done" },
            false,
            "editorReady"
          );
        },

        editorTimedOut() {
          set({ editorStartUp: "timed out" }, false, "editorTimedOut");
        },

        getEditorStartUp() {
          return get().editorStartUp;
        },

        setIsEditorTimedOutDialogOpen(isOpen: boolean) {
          set(
            { isEditorTimedOutDialogOpen: isOpen },
            false,
            "setIsEditorTimedOutDialogOpen"
          );
        },

        async editorChange(newProject: MakeCodeProject) {
          // Notes on past issues with the MakeCode integration:
          //
          // We update MakeCode only as needed. However, it loads in the
          // background because we need it to be ready. This means it will
          // have the initial project from the state open. So we must be sure
          // to update MakeCode before "Edit in MakeCode" and "Save" actions.
          //
          // MakeCode has a visibility listener that will cause it to re-run
          // its initialization when its tab becomes hidden/visible. We aim to
          // ignore this when MakeCode is closed. When MakeCode is open we'll
          // have up-to-date state to reinit MakeCode with. In the past this
          // has caused us to update app state with old data from MakeCode.
          //
          // It's too slow/async from a UI perspective to rely on only
          // understanding project contents via editorChange as they're
          // delayed by MakeCode load and then the async nature of loading a
          // project.
          //
          // We have no choice but to write to MakeCode and wait for the
          // project data in editorChange when loading a hex file.

          const actionName = "editorChange";
          const { id, settings, timestamp, projectEdited } = get();
          const updatedSettings: Settings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, "DataSamplesRecorded"])
            ),
          };
          let updatedTimestamp = timestamp;
          let updatedProjectEdited = projectEdited;
          let newActions: ActionData[] | undefined;
          let importProject = false;
          let updateMakeCodeProject = false;
          const newProjectId = uuid();
          set(
            (state) => {
              const {
                project: prevProject,
                isEditorOpen,
                isEditorImportingState,
                isEditorLoadingFile,
              } = state;
              const newProjectHeader = newProject.header!.id;
              const previousProjectHeader = prevProject.header!.id;
              if (
                (isEditorLoadingFile ||
                  isEditorOpen ||
                  isEditorImportingState) &&
                newProjectHeader !== previousProjectHeader
              ) {
                if (isEditorImportingState) {
                  // It's a change but we originated it so state is in sync.
                  logging.log(
                    `[MakeCode] Ignored header change due to us syncing state. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                  );
                  updateMakeCodeProject = true;
                  return {
                    isEditorImportingState: false,
                    // Still need to update this for the new header id.
                    project: newProject,
                  };
                } else {
                  // It's a change that originated in MakeCode, e.g. a hex load, so update our state.
                  logging.log(
                    `[MakeCode] Updating state from MakeCode header change. ID change: ${prevProject.header?.id} -> ${newProject.header?.id}`
                  );
                  const projectActions = getActionsFromProject(newProject);
                  newActions =
                    projectActions.length > 0
                      ? projectActions
                      : [createFirstAction()];
                  updatedTimestamp = Date.now();
                  updatedProjectEdited = projectInHexIsEdited(newProject);
                  importProject = true;
                  return {
                    id: newProjectId,
                    settings: updatedSettings,
                    project: newProject,
                    projectLoadTimestamp: updatedTimestamp,
                    timestamp: updatedTimestamp,
                    // New project loaded externally so we can't know whether its edited.
                    projectEdited: updatedProjectEdited,
                    actions: newActions,
                    dataWindow: getDataWindowFromActions(newActions),
                    hint: getHint(newActions, true),
                    model: undefined,
                    isEditorOpen: false,
                    isEditorLoadingFile: false,
                    isLoadingOverlayVisible: false,
                  };
                }
              } else if (isEditorOpen) {
                logging.log(
                  `[MakeCode] Edit copied to project. ID ${newProject.header?.id}`
                );
                updatedProjectEdited = true;
                updateMakeCodeProject = true;
                return {
                  project: newProject,
                  // We just assume its been edited as spurious changes from MakeCode happen that we can't identify
                  projectEdited: updatedProjectEdited,
                };
              } else {
                // This lets us skip more pointless init-time edits.
                logging.log(
                  `[MakeCode] Edit ignored when closed. ID ${newProject.header?.id}`
                );
              }
              return state;
            },
            false,
            actionName
          );
          if (importProject) {
            projectSessionStorage.setProjectId(newProjectId);
            await storageWriteWithErrHandling(() =>
              storage.importProject(
                newActions as ActionData[],
                {
                  project: newProject,
                  projectEdited: updatedProjectEdited,
                },
                { timestamp: updatedTimestamp, id: newProjectId }
              )
            );
            await storageWriteWithErrHandling(() =>
              storage.updateSettings(updatedSettings)
            );
          } else if (updateMakeCodeProject) {
            await storageWriteWithErrHandling(() =>
              storage.updateMakeCodeProject(
                id,
                {
                  project: newProject,
                  projectEdited: updatedProjectEdited,
                },
                updatedTimestamp
              )
            );
          }
        },
        setDownload(download: DownloadState) {
          set({ download }, false, "setDownload");
        },
        setDownloadFlashingProgress(stage, value) {
          set(
            { downloadFlashingProgress: { stage, value } },
            false,
            "setDownloadFlashingProgress"
          );
        },
        setDataConnection(dataConnection: DataConnectionState) {
          set({ dataConnection }, false, "setDataConnection");
        },
        setDataConnectionType(dataConnectionType: DataConnectionType) {
          set(
            ({ dataConnection }) => ({
              dataConnection: { ...dataConnection, type: dataConnectionType },
            }),
            false,
            "setDataConnectionType"
          );
        },
        setDataConnectionFlashingProgress(stage, value) {
          set(
            { dataConnectionFlashingProgress: { stage, value } },
            false,
            "setDataConnectionFlashingProgress"
          );
        },
        setSave(save: SaveState) {
          set({ save }, false, "setSave");
        },
        setEditorLoadingFile() {
          set({ isEditorLoadingFile: true }, false, "setEditorLoadingFile");
        },
        setEditorImportingState() {
          set(
            { isEditorImportingState: true },
            false,
            "setEditorImportingState"
          );
        },
        langChangeFlushedToEditor() {
          set(
            {
              langChanged: false,
            },
            false,
            "langChangeFlushedToEditor"
          );
        },
        projectFlushedToEditor() {
          set(
            {
              appEditNeedsFlushToEditor: false,
            },
            false,
            "projectFlushedToEditor"
          );
        },
        setPostConnectTourTrigger(trigger: TourTrigger | undefined) {
          set(
            { postConnectTourTrigger: trigger },
            false,
            "setPostConnectTourId"
          );
        },
        dataCollectionMicrobitConnected() {
          set(
            ({ actions, tourState, postConnectTourTrigger }) => {
              return {
                actions: actions.length === 0 ? [createFirstAction()] : actions,

                // If a tour has been explicitly requested, do that.
                // Other tours are triggered by callbacks or effects on the relevant page so they run only on the correct screen.
                tourState: postConnectTourTrigger
                  ? {
                      index: 0,
                      ...getTourSpec(postConnectTourTrigger, actions),
                    }
                  : tourState,
                postConnectTourTrigger: undefined,
              };
            },
            false,
            "dataCollectionMicrobitConnected"
          );
        },

        async tourStart(trigger: TourTrigger, manual: boolean = false) {
          if (flags.skipTours && !manual) {
            return;
          }
          const { actions, settings, tourState } = get();
          if (
            manual ||
            (!tourState && !settings.toursCompleted.includes(trigger.name))
          ) {
            const tourSpec = getTourSpec(trigger, actions);
            // If manually triggered, filter out subsequent tours as they should run again too when reached
            const updatedSettings = manual
              ? {
                  ...settings,
                  toursCompleted: settings.toursCompleted.filter(
                    (t) =>
                      tourSequence.indexOf(t) <=
                      tourSequence.indexOf(trigger.name)
                  ),
                }
              : settings;
            const timestamp = Date.now();
            const updatedState = {
              tourState: {
                ...tourSpec,
                index: 0,
              },
              settings: updatedSettings,
              timestamp,
            };
            set(updatedState);
            await storageWriteWithErrHandling(
              () => storage.updateSettings(updatedSettings),
              "settings"
            );
          }
        },
        tourNext() {
          set(({ tourState }) => {
            if (!tourState) {
              throw new Error("No tour");
            }
            return {
              tourState: { ...tourState, index: tourState.index + 1 },
            };
          });
        },
        tourBack() {
          set(({ tourState }) => {
            if (!tourState) {
              throw new Error("No tour");
            }
            return {
              tourState: { ...tourState, index: tourState.index - 1 },
            };
          });
        },
        async tourComplete(triggers: TourTriggerName[]) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            toursCompleted: Array.from(
              new Set([...settings.toursCompleted, ...triggers])
            ),
          };
          const timestamp = Date.now();
          set({
            tourState: undefined,
            settings: updatedSettings,
            timestamp,
          });
          await storageWriteWithErrHandling(
            () => storage.updateSettings(updatedSettings),
            "settings"
          );
        },

        async setDataSamplesView(view: DataSamplesView) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            dataSamplesView: view,
          };
          const timestamp = Date.now();
          set({
            settings: updatedSettings,
            timestamp,
          });
          await storageWriteWithErrHandling(
            () => storage.updateSettings(updatedSettings),
            "settings"
          );
        },
        async setShowGraphs(show: boolean) {
          const { settings } = get();
          const updatedSettings = {
            ...settings,
            showGraphs: show,
          };
          set({
            settings: updatedSettings,
          });
          await storageWriteWithErrHandling(
            () => storage.updateSettings(updatedSettings),
            "settings"
          );
        },

        setPostImportDialogState(state: PostImportDialogState) {
          set({ postImportDialogState: state });
        },

        startPredicting(buffer: BufferedData) {
          const { actions, model, predictionInterval, dataWindow } = get();
          if (!model || predictionInterval) {
            return;
          }
          const classificationIds = actions.map((a) => a.id);
          // Don't queue a new predict request while one is in flight; skip
          // the tick instead.
          let inFlight = false;
          const newPredictionInterval = setInterval(() => {
            if (inFlight) {
              return;
            }
            const startTime = Date.now() - dataWindow.duration;
            const data = buffer.getSamples(startTime);
            if (data.x.length <= dataWindow.minSamples) {
              return;
            }
            const features = Object.values(applyFilters(data, dataWindow));
            inFlight = true;
            mlWorker
              .predict(features)
              .then((values) => {
                inFlight = false;
                // The worker drops requests while training/loading a model
                // and after errors; skip those ticks.
                if (!values) {
                  return;
                }
                // Discard stale responses after stopPredicting/restart.
                if (get().predictionInterval !== newPredictionInterval) {
                  return;
                }
                const confidences = classificationIds.reduce(
                  (acc, id, idx) => ({ ...acc, [id]: values[idx] }),
                  {} as Confidences
                );
                const detected = getDetectedAction(
                  // Get latest actions from store so that changes to
                  // recognition point are realised.
                  get().actions,
                  confidences
                );
                set({
                  predictionResult: {
                    detected,
                    confidences,
                  },
                });
              })
              .catch((err) => {
                inFlight = false;
                logging.error("Prediction error", err);
              });
          }, 1000 / mlSettings.updatesPrSecond);
          set({ predictionInterval: newPredictionInterval });
        },

        getPrediction() {
          return get().predictionResult;
        },

        stopPredicting() {
          const { predictionInterval } = get();
          if (predictionInterval) {
            clearInterval(predictionInterval);
            set({ predictionInterval: undefined });
          }
        },

        languageDialogOnOpen() {
          set({ isLanguageDialogOpen: true });
        },
        settingsDialogOnOpen() {
          set({ isSettingsDialogOpen: true });
        },
        connectFirstDialogOnOpen() {
          set({ isConnectFirstDialogOpen: true });
        },
        aboutDialogOnOpen() {
          set({ isAboutDialogOpen: true });
        },
        feedbackFormOnOpen() {
          set({ isFeedbackFormOpen: true });
        },
        deleteAllActionsDialogOnOpen() {
          set({ isDeleteAllActionsDialogOpen: true });
        },
        nameProjectDialogOnOpen() {
          set({ isNameProjectDialogOpen: true });
        },
        recordingDialogOnOpen() {
          set({ isRecordingDialogOpen: true });
        },
        connectToRecordDialogOnOpen() {
          set({ isConnectToRecordDialogOpen: true });
        },
        deleteActionDialogOnOpen() {
          set({ isDeleteActionDialogOpen: true });
        },
        incompatibleEditorDeviceDialogOnOpen() {
          set({ isIncompatibleEditorDeviceDialogOpen: true });
        },
        dismissWelcomeDialog() {
          set(
            { welcomeDialogDismissedForProject: get().id },
            false,
            "dismissWelcomeDialog"
          );
        },
        resetWelcomeDialog() {
          set(
            { welcomeDialogDismissedForProject: undefined },
            false,
            "resetWelcomeDialog"
          );
        },

        closeDialog() {
          set({
            isLanguageDialogOpen: false,
            isSettingsDialogOpen: false,
            isConnectFirstDialogOpen: false,
            isAboutDialogOpen: false,
            isFeedbackFormOpen: false,
            isDeleteAllActionsDialogOpen: false,
            isNameProjectDialogOpen: false,
            isRecordingDialogOpen: false,
            isConnectToRecordDialogOpen: false,
            isDeleteActionDialogOpen: false,
            isIncompatibleEditorDeviceDialogOpen: false,
            isWelcomeDialogOpen: false,
            isEditorTimedOutDialogOpen: false,
            trainModelDialogStage: TrainModelDialogStage.Closed,
            postImportDialogState: PostImportDialogState.None,
            save: { step: SaveStep.None, type: SaveType.Download },
          });
        },

        isNonConnectionDialogOpen() {
          const {
            isAboutDialogOpen,
            isSettingsDialogOpen,
            isConnectFirstDialogOpen,
            isLanguageDialogOpen,
            isFeedbackFormOpen,
            postImportDialogState,
            isEditorOpen,
            tourState,
            trainModelDialogStage,
            isEditorTimedOutDialogOpen,
            isDeleteAllActionsDialogOpen,
            isNameProjectDialogOpen,
            isRecordingDialogOpen,
            isConnectToRecordDialogOpen,
            isDeleteActionDialogOpen,
            isIncompatibleEditorDeviceDialogOpen,
            isWelcomeDialogOpen,
            save,
          } = get();
          return (
            isAboutDialogOpen ||
            isSettingsDialogOpen ||
            isConnectFirstDialogOpen ||
            isLanguageDialogOpen ||
            isFeedbackFormOpen ||
            isDeleteAllActionsDialogOpen ||
            isNameProjectDialogOpen ||
            isRecordingDialogOpen ||
            isConnectToRecordDialogOpen ||
            isDeleteActionDialogOpen ||
            isIncompatibleEditorDeviceDialogOpen ||
            postImportDialogState !== PostImportDialogState.None ||
            isEditorOpen ||
            tourState !== undefined ||
            trainModelDialogStage !== TrainModelDialogStage.Closed ||
            isEditorTimedOutDialogOpen ||
            save.step !== SaveStep.None ||
            isWelcomeDialogOpen
          );
        },
      })),
      { enabled: flags.devtools }
    )
  );
};

export const useStore = createMlStore(deployment.logging);

const getDataWindowFromActions = (actions: ActionData[]): DataWindow => {
  const dataLength = actions.flatMap((a) => a.recordings)[0]?.data.x.length;
  return dataLength >= legacyDataWindow.minSamples
    ? legacyDataWindow
    : currentDataWindow;
};

const loadModelFromStorage = async (id: string) => {
  const artifacts = await storageWithErrHandling(
    () => storage.loadModel(id),
    false
  );
  let model: TrainedModel | undefined;
  if (artifacts) {
    // Only the model artifacts are persisted; compile the machine code with
    // the current ml4f as part of loading the model into the worker.
    const loaded = await mlWorker.loadModel(artifacts);
    if (loaded?.machineCode) {
      model = { artifacts, machineCode: loaded.machineCode };
    } else {
      deployment.logging.error(
        "Storage error",
        new Error("Failed to load stored model in ML worker")
      );
    }
  }
  useStore.setState({ model }, false, "loadModel");
};

useStore.subscribe(async (state, prevState) => {
  const { model: newModel, id: newId } = state;
  const { model: previousModel, id: prevId } = prevState;
  if (newModel !== previousModel) {
    if (!newModel && newId && newId === prevId) {
      await storageWriteWithErrHandling(
        () => storage.removeModel(newId),
        false
      );
      const message: BroadcastChannelData = {
        messageType: BroadcastChannelMessageType.REMOVE_MODEL,
        projectIds: [newId],
      };
      broadcastChannel.postMessage(message);
    } else if (newModel) {
      await storageWriteWithErrHandling(
        () => storage.saveModel(newId, newModel.artifacts),
        false
      );
    }
  }
});

export const useHasActions = () => {
  const actions = useStore((s) => s.actions);
  return (
    (actions.length > 0 && actions[0].name.length > 0) ||
    actions[0]?.recordings.length > 0
  );
};

const hasSufficientDataForTraining = (actions: ActionData[]): boolean => {
  return actions.length >= 2 && actions.every((a) => a.recordings.length >= 3);
};

export const useHasSufficientDataForTraining = (): boolean => {
  const actions = useStore((s) => s.actions);
  return hasSufficientDataForTraining(actions);
};

export const useHasNoStoredData = (): boolean => {
  const actions = useStore((s) => s.actions);
  return !(
    actions.length !== 0 && actions.some((a) => a.recordings.length > 0)
  );
};

type UseSettingsReturn = [Settings, (settings: Partial<Settings>) => void];

export const inContextTranslationLangId = "lol";

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useStore(
    useShallow((s) => [s.settings, s.setSettings])
  );
  const settingsOverride = flags.translate
    ? { languageId: inContextTranslationLangId }
    : {};
  return [{ ...settings, ...settingsOverride }, setSettings];
};

const actionIcon = ({
  isFirstAction,
  existingActions,
}: {
  isFirstAction: boolean;
  existingActions: Action[];
}) => {
  if (isFirstAction) {
    return defaultIcons[0];
  }
  const iconsInUse = existingActions.map((a) => a.icon);
  const useableIcons: MakeCodeIcon[] = [];
  for (const icon of defaultIcons) {
    if (!iconsInUse.includes(icon)) {
      useableIcons.push(icon);
    }
  }
  if (!useableIcons.length) {
    // Better than throwing an error.
    return "Heart";
  }
  return useableIcons[0];
};

const getActionsFromProject = (project: MakeCodeProject): ActionData[] => {
  const { text } = project;
  if (text === undefined || !("dataset.json" in text)) {
    return [];
  }
  const dataset = JSON.parse(text["dataset.json"]) as object;
  if (typeof dataset !== "object" || !("data" in dataset)) {
    return [];
  }
  return migrateLegacyActionDataAndAssignNewIds(
    dataset.data as OldActionData[] | ActionData[]
  );
};

const projectInHexIsEdited = (project: MakeCodeProject): boolean => {
  // Prior to storing projectEdited in the MakeCode project, hex files loaded externally
  // are assumed to be edited but there is no way of knowing for sure.
  let projectEdited = true;
  const metadataString = project.text?.[filenames.metadata];
  const metadata = JSON.parse(metadataString ?? "{}") as Record<
    string,
    unknown
  >;
  // projectEdited is only ever a flag to indicate whether the project was edited in this app. It cannot
  // account for cases where the project was edited in MakeCode after being downloaded from this app.
  // A value of false cannot be trusted which is why main.ts must also be checked.
  // For older projects without the projectEdited metadata, this may restore the default program over a blank program.
  if (!metadata["projectEdited"] && project.text?.[filenames.mainTs] === "\n") {
    projectEdited = false;
  }
  return projectEdited;
};

let storageErrorReported = false;
const setStorageError = (err: unknown) => {
  if (!storageErrorReported) {
    storageErrorReported = true;
    deployment.logging.error("Storage error", err);
  }
  useStore.setState({
    storageError: {
      type:
        err instanceof DOMException && err.name === "QuotaExceededError"
          ? "quota"
          : "other",
      kind: isNativePlatform() ? "device" : "browser",
    },
  });
};

/**
 * Wraps a storage operation with error handling.
 *
 * Write operations show a toast and swallow the error so that
 * optimistic UI updates are not disrupted by an error boundary.
 * Read operations re-throw so that React Router loaders / error
 * boundaries can handle them.
 */
const storageWithErrHandling = async <T>(
  callback: () => Promise<T>,
  broadcastEvent: boolean | "settings" = true
) => {
  const value = await callback();
  const projectId = useStore.getState().id;
  const settings = broadcastEvent === "settings";
  if (broadcastEvent && (projectId || settings)) {
    const message: BroadcastChannelData = {
      messageType: BroadcastChannelMessageType.RELOAD_PROJECT,
      projectIds: projectId ? [projectId] : [],
      ...(settings && { settings: true }),
    };
    broadcastChannel.postMessage(message);
  }
  return value;
};

const storageWriteTimeoutMs = 15000;

/**
 * A promise that rejects with {@link message} after {@link ms}, plus a cancel
 * to clear its timer once the operation it guards has settled (preventing a
 * late rejection).
 */
const rejectAfter = (
  ms: number,
  message: string
): { promise: Promise<never>; cancel: () => void } => {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return { promise, cancel: () => clearTimeout(timer) };
};

/**
 * Like {@link storageWithErrHandling} but sets a storage error in the
 * store (triggering a toast) and swallows the error. Use for
 * fire-and-forget writes where the in-memory state has already been
 * optimistically updated.
 *
 * Bounded by {@link storageWriteTimeoutMs}.
 */
const storageWriteWithErrHandling = async (
  callback: () => Promise<void>,
  broadcastEvent: boolean | "settings" = true
) => {
  const timeout = rejectAfter(storageWriteTimeoutMs, "Storage write timed out");
  try {
    await Promise.race([
      storageWithErrHandling(callback, broadcastEvent),
      timeout.promise,
    ]);
  } catch (err) {
    setStorageError(err);
  } finally {
    timeout.cancel();
  }
};

export const loadProjectAndModelFromStorage = async (id: string) => {
  await useStore.getState().loadProjectFromStorage(id);
  await loadModelFromStorage(id);
  return true;
};

export const getAllProjectsFromStorage = async (): Promise<boolean> => {
  await useStore.getState().getAllProjectData();
  return true;
};

export const loadSettingsFromStorage = async () => {
  const settings = await storage.getSettings();
  useStore.setState({ settings, settingsLoaded: true });
};

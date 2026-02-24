import { MakeCodeProject } from "@microbit/makecode-embed";
import { DBSchema, IDBPDatabase, IDBPObjectStore, openDB } from "idb";
import orderBy from "lodash.orderby";
import { Action, ActionData, RecordingData } from "./model";
import {
  migrateLegacyActionDataAndAssignNewIds,
  untitledProjectName,
} from "./project-utils";
import { defaultSettings, Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";
import { v4 as uuid } from "uuid";
import * as tf from "@tensorflow/tfjs";
import { createPromise, PromiseInfo } from "./hooks/use-promise-ref";
import { projectSessionStorage } from "./session-storage";

const DATABASE_NAME = "ml";

export interface PersistedProjectData {
  id: string;
  actions: ActionData[];
  project: MakeCodeProject;
  projectEdited: boolean;
  settings: Settings;
  timestamp: number | undefined;
}

export interface MakeCodeData {
  project: MakeCodeProject;
  projectEdited: boolean;
}

export class StorageError extends Error {}

export interface StoreAction extends Action {
  projectId: string;
}

export interface StoreRecordingData extends RecordingData {
  actionId: string;
}

export interface ProjectData {
  id: string;
  name: string;
  timestamp: number;
}

export interface ProjectDataWithActions extends ProjectData {
  actions: StoreAction[];
}

/**
 * Storage backend interface for project data persistence.
 */
export interface Database {
  newSession(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; name: string; id: string }
  ): Promise<void>;
  /**
   * Load a project by ID. Updates the project's timestamp so it becomes
   * the most recently accessed project.
   */
  getProject(id: string): Promise<PersistedProjectData>;
  getAllProjectData(): Promise<ProjectDataWithActions[]>;
  importProject(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string },
    settings: Settings
  ): Promise<void>;
  addAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  updateAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  updateActions(
    id: string | undefined,
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  deleteAction(
    id: string | undefined,
    action: ActionData,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  deleteAllActions(
    id: string | undefined,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  replaceActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string | undefined },
    settings: Settings
  ): Promise<void>;
  addRecording(
    id: string | undefined,
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  deleteRecording(
    id: string | undefined,
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  updateMakeCodeProject(
    id: string | undefined,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void>;
  updateProjectTimestamp(
    id: string | undefined,
    timestamp: number
  ): Promise<void>;
  renameProject(id: string, name: string, timestamp: number): Promise<void>;
  /**
   * Duplicate a project including actions, recordings, MakeCode data,
   * and trained model.
   */
  duplicateProject(
    existingProjectId: string,
    newProjectData: ProjectData
  ): Promise<void>;
  /**
   * Delete a project and all associated data including actions, recordings,
   * MakeCode data, and trained model.
   */
  deleteProject(id: string): Promise<void>;
  /**
   * Delete multiple projects and all associated data.
   */
  deleteProjects(ids: string[]): Promise<void>;
  updateSettings(
    id: string | undefined,
    settings: Settings,
    timestamp: number
  ): Promise<void>;
  saveModel(id: string | undefined, model: tf.LayersModel): Promise<void>;
  removeModel(id: string | undefined): Promise<void>;
  loadModel(id: string): Promise<tf.LayersModel | undefined>;
}

enum DatabaseStore {
  PROJECT_DATA = "project-data",
  EDITOR_PROJECT = "editor-project",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
  MODELS = "models",
}

/**
 * Serializable model data stored in IndexedDB.
 */
interface StoredModelData {
  modelTopology?: object | ArrayBuffer;
  trainingConfig?: tf.io.TrainingConfig;
  weightSpecs?: tf.io.WeightsManifestEntry[];
  weightData?: ArrayBuffer;
  format?: string;
  generatedBy?: string;
  convertedBy?: string | null;
}

const oldModelUrl = "indexeddb://micro:bit-ai-creator-model";

const defaultTimestamp = Date.now();
const defaultProjectId = uuid();

const defaultStoreData: Record<
  DatabaseStore.SETTINGS,
  { key: string; value: Settings }
> = {
  [DatabaseStore.SETTINGS]: {
    value: defaultSettings,
    key: DatabaseStore.SETTINGS,
  },
};

interface Schema extends DBSchema {
  [DatabaseStore.PROJECT_DATA]: {
    key: string;
    value: ProjectData;
  };
  [DatabaseStore.ACTIONS]: {
    key: string;
    value: StoreAction;
    indexes: { projectId: string };
  };
  [DatabaseStore.RECORDINGS]: {
    key: string;
    value: StoreRecordingData;
    indexes: { actionId: string };
  };
  [DatabaseStore.EDITOR_PROJECT]: {
    key: string;
    value: MakeCodeData;
  };
  [DatabaseStore.SETTINGS]: {
    key: string;
    value: Settings;
  };
  [DatabaseStore.MODELS]: {
    key: string;
    value: StoredModelData;
  };
}

export class IdbDatabase implements Database {
  private dbPromise: Promise<IDBPDatabase<Schema>>;
  private dbInitValuesPromise: PromiseInfo<void> | undefined;
  private dbReady: boolean = false;
  constructor() {
    this.dbPromise = this.initializeDb();
  }

  private async useDb(): Promise<IDBPDatabase<Schema>> {
    if (this.dbReady) {
      return this.dbPromise;
    }
    const db = await this.dbPromise;
    const settings = await db.get(
      DatabaseStore.SETTINGS,
      DatabaseStore.SETTINGS
    );
    // If there are no settings then migrate data from local storage
    // or initialize default values.
    if (!settings) {
      if (this.dbInitValuesPromise) {
        await this.dbInitValuesPromise.promise;
      } else {
        this.dbInitValuesPromise = createPromise<void>();
        await this.migrateFromLocalStorage(db);
        this.dbInitValuesPromise.resolve();
      }
    }
    this.dbReady = true;
    return db;
  }

  private async initializeDb(): Promise<IDBPDatabase<Schema>> {
    const db = await openDB<Schema>(DATABASE_NAME, 1, {
      upgrade(db) {
        for (const store of Object.values(DatabaseStore)) {
          const objectStore = db.createObjectStore(store);
          if (store === DatabaseStore.ACTIONS) {
            (
              objectStore as IDBPObjectStore<
                Schema,
                ArrayLike<DatabaseStore>,
                DatabaseStore.ACTIONS,
                "versionchange"
              >
            ).createIndex("projectId", "projectId");
          }
          if (store === DatabaseStore.RECORDINGS) {
            (
              objectStore as IDBPObjectStore<
                Schema,
                ArrayLike<DatabaseStore>,
                DatabaseStore.RECORDINGS,
                "versionchange"
              >
            ).createIndex("actionId", "actionId");
          }
        }
      },
    });
    for (const store of Object.values(DatabaseStore)) {
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        throw new DOMException(
          `Database is missing expected store "${store}". ` +
            "It may have been created by an incompatible version of the app.",
          "VersionError"
        );
      }
    }
    return db;
  }

  private async migrateFromLocalStorage(
    db: IDBPDatabase<Schema>
  ): Promise<void> {
    const localStorageProject = getLocalStorageProject();
    if (!localStorageProject) {
      // Set default values if there is are no data to migrate.
      const defaultData = defaultStoreData[DatabaseStore.SETTINGS];
      await db.add(DatabaseStore.SETTINGS, defaultData.value, defaultData.key);
      return;
    }
    const tx = db.transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await Promise.all(
      localStorageProject.actions.map((a) =>
        actionsStore.add(prepActionForStorage(a, defaultProjectId), a.id)
      )
    );
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await Promise.all(
      localStorageProject.actions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );

    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.add(
      {
        project: localStorageProject.project,
        projectEdited: localStorageProject.projectEdited,
      },
      defaultProjectId
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.add(
      {
        id: defaultProjectId,
        timestamp: localStorageProject.timestamp ?? defaultTimestamp,
        name: localStorageProject.project.header?.name ?? untitledProjectName,
      },
      defaultProjectId
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);

    await settingsStore.add(
      localStorageProject.settings,
      DatabaseStore.SETTINGS
    );
    try {
      const model = await tf.loadLayersModel(oldModelUrl);
      if (model) {
        await model.save(
          tf.io.withSaveHandler(async (artifacts) => {
            await db.add(
              DatabaseStore.MODELS,
              modelArtifactsToStoredData(artifacts),
              defaultProjectId
            );
            return {
              modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
            };
          })
        );
      }
    } catch (err) {
      // There is no model.
    }
    projectSessionStorage.setProjectId(defaultProjectId);
    // TODO: Re-enable when merging beta to main. Disabled because beta
    // shares an origin with live, so we must not delete live's data.
    // await tf.io.removeModel(oldModelUrl);
    // localStorage.removeItem(DATABASE_NAME);
  }

  async newSession(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; name: string; id: string }
  ): Promise<void> {
    const id = projectData.id;
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await Promise.all(
      actions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      actions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.add(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.add(projectData, id);
    return tx.done;
  }

  async getProject(id: string): Promise<PersistedProjectData> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    // Ensure that this project will be loaded by default during next page load.
    await projectDataStore.put({ ...projectData, timestamp: Date.now() }, id);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const storeActions = orderBy(
      assertDataArray(await actionsStore.index("projectId").getAll(id)),
      "createdAt",
      "asc"
    );
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const actions: ActionData[] = await Promise.all(
      storeActions.map(async (action) => {
        return {
          id: action.id,
          name: action.name,
          icon: action.icon,
          requiredConfidence: action.requiredConfidence,
          createdAt: action.createdAt,
          recordings: assertDataArray(
            await recordingsStore.index("actionId").getAll(action.id)
          ),
        };
      })
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    const makeCodeData = assertData(await makeCodeStore.get(id));
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    const settings = assertData(
      await settingsStore.get(DatabaseStore.SETTINGS)
    );
    await tx.done;
    return {
      id,
      actions,
      project: makeCodeData.project,
      projectEdited: makeCodeData.projectEdited,
      timestamp: projectData.timestamp,
      settings,
    };
  }

  async importProject(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string },
    settings: Settings
  ): Promise<void> {
    const id = projectData.id;
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await Promise.all(
      actions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      actions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.add(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.add(
      {
        ...projectData,
        name: makeCodeData.project.header?.name ?? untitledProjectName,
      },
      id
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    return tx.done;
  }

  async getAllProjectData(): Promise<ProjectDataWithActions[]> {
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.ACTIONS, DatabaseStore.PROJECT_DATA],
      "readonly"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = orderBy(
      await projectDataStore.getAll(),
      "timestamp",
      "desc"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const projectDataWithActions = await Promise.all(
      projectData.map(async (p) => ({
        ...p,
        actions: assertDataArray(
          await actionsStore.index("projectId").getAll(p.id)
        ),
      }))
    );
    return projectDataWithActions;
  }

  async addAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, id);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.add(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async updateAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, id);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.put(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async updateActions(
    id: string | undefined,
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await Promise.all(
      actions.map((action) =>
        actionsStore.put(prepActionForStorage(action, id), action.id)
      )
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async deleteAction(
    id: string | undefined,
    action: ActionData,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.delete(action.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = await recordingsStore
      .index("actionId")
      .getAllKeys(action.id);
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    await Promise.all(
      newActions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      newActions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put({ ...projectData, timestamp }, id);
    return tx.done;
  }

  async deleteAllActions(
    id: string | undefined,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionIds = await actionsStore.index("projectId").getAllKeys(id);
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    await Promise.all(
      newActions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      newActions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    await projectDataStore.put({ ...projectData, timestamp }, id);
    return tx.done;
  }

  async replaceActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string | undefined },
    settings: Settings
  ) {
    const id = this.assertProjectId(projectData.id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionIds = await actionsStore.index("projectId").getAllKeys(id);
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    await Promise.all(
      actions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      actions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.put(
      {
        ...projectData,
        id,
        name: makeCodeData.project.header?.name ?? untitledProjectName,
      },
      id
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    return tx.done;
  }

  async addRecording(
    id: string | undefined,
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action, id);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.add(
      { ...recording, actionId: action.id },
      recording.id
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async deleteRecording(
    id: string | undefined,
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action, id);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.delete(key);
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async updateMakeCodeProject(
    id: string | undefined,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.EDITOR_PROJECT, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
        name: makeCodeData.project.header?.name ?? untitledProjectName,
      },
      id
    );
    return tx.done;
  }

  async updateProjectTimestamp(id: string | undefined, timestamp: number) {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
      },
      id
    );
    return tx.done;
  }

  async renameProject(id: string, name: string, timestamp: number) {
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.EDITOR_PROJECT, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    const makeCodeData = assertData(await makeCodeStore.get(id));
    await makeCodeStore.put(
      {
        ...makeCodeData,
        project: {
          ...makeCodeData.project,
          header: makeCodeData.project.header
            ? {
                ...makeCodeData.project.header,
                name,
              }
            : undefined,
        },
      },
      id
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put(
      {
        ...projectData,
        timestamp,
        name,
      },
      id
    );
    return tx.done;
  }

  async duplicateProject(
    existingProjectId: string,
    newProjectData: ProjectData
  ) {
    const { id, name, timestamp } = newProjectData;
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.MODELS,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actions = await actionsStore
      .index("projectId")
      .getAll(existingProjectId);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const storePromises: Promise<string>[] = [];
    await Promise.all(
      actions.map(async (action) => {
        const recordings = await recordingsStore
          .index("actionId")
          .getAll(action.id);
        const newActionId = uuid();
        storePromises.push(
          actionsStore.add(
            { ...action, id: newActionId, projectId: id },
            newActionId
          )
        );
        recordings.forEach((r) => {
          const newRecordingId = uuid();
          storePromises.push(
            recordingsStore.add(
              { ...r, id: newRecordingId, actionId: newActionId },
              newRecordingId
            )
          );
        });
      })
    );
    await Promise.all(storePromises);
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    const makeCodeData = assertData(await makeCodeStore.get(existingProjectId));
    await makeCodeStore.add(
      {
        ...makeCodeData,
        project: {
          ...makeCodeData.project,
          header: makeCodeData.project.header
            ? {
                ...makeCodeData.project.header,
                name,
              }
            : undefined,
        },
      },
      id
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(
      await projectDataStore.get(existingProjectId)
    );
    await projectDataStore.add(
      {
        ...projectData,
        id,
        name,
        timestamp,
      },
      id
    );
    const modelsStore = tx.objectStore(DatabaseStore.MODELS);
    const modelData = await modelsStore.get(existingProjectId);
    if (modelData) {
      await modelsStore.add(modelData, id);
    }
    return tx.done;
  }

  async deleteProject(id: string): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.MODELS,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionIds = await actionsStore.index("projectId").getAllKeys(id);
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    await makeCodeStore.delete(id);
    await tx.objectStore(DatabaseStore.MODELS).delete(id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.delete(id);
    await tx.done;
  }

  async deleteProjects(ids: string[]): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.EDITOR_PROJECT,
        DatabaseStore.MODELS,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const makeCodeStore = tx.objectStore(DatabaseStore.EDITOR_PROJECT);
    const modelsStore = tx.objectStore(DatabaseStore.MODELS);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const actionIds = (
      await Promise.all(
        ids.map((id) => actionsStore.index("projectId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    await Promise.all(ids.map((id) => makeCodeStore.delete(id)));
    await Promise.all(ids.map((id) => modelsStore.delete(id)));
    await Promise.all(ids.map((id) => projectDataStore.delete(id)));
    await tx.done;
  }

  async updateSettings(
    id: string | undefined,
    settings: Settings,
    timestamp: number
  ): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.PROJECT_DATA, DatabaseStore.SETTINGS],
      "readwrite"
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    // Settings can be changed on pages where a project might not yet be loaded.
    if (id) {
      const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
      const projectData = assertData(await projectDataStore.get(id));
      await projectDataStore.put(
        {
          ...projectData,
          timestamp,
        },
        id
      );
    }
    return tx.done;
  }

  async saveModel(id: string | undefined, model: tf.LayersModel) {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await model.save(
      tf.io.withSaveHandler(async (artifacts) => {
        await db.put(
          DatabaseStore.MODELS,
          modelArtifactsToStoredData(artifacts),
          id
        );
        return {
          modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
        };
      })
    );
  }

  async removeModel(id: string | undefined) {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.delete(DatabaseStore.MODELS, id);
  }

  async loadModel(id: string): Promise<tf.LayersModel | undefined> {
    const db = await this.useDb();
    const stored = await db.get(DatabaseStore.MODELS, id);
    if (!stored) {
      return undefined;
    }
    const artifacts: tf.io.ModelArtifacts = {
      modelTopology: stored.modelTopology,
      weightSpecs: stored.weightSpecs,
      weightData: stored.weightData,
      trainingConfig: stored.trainingConfig,
      format: stored.format,
      generatedBy: stored.generatedBy,
      convertedBy: stored.convertedBy,
    };
    return tf.loadLayersModel(tf.io.fromMemory(artifacts));
  }

  private assertProjectId(id: string | undefined) {
    if (!id) {
      throw new StorageError("Project id is undefined");
    }
    return id;
  }
}

const modelArtifactsToStoredData = (
  artifacts: tf.io.ModelArtifacts
): StoredModelData => {
  const weightData = artifacts.weightData
    ? tf.io.concatenateArrayBuffers(
        Array.isArray(artifacts.weightData)
          ? artifacts.weightData
          : [artifacts.weightData]
      )
    : undefined;
  return {
    modelTopology: artifacts.modelTopology,
    trainingConfig: artifacts.trainingConfig,
    weightSpecs: artifacts.weightSpecs,
    weightData,
    format: artifacts.format,
    generatedBy: artifacts.generatedBy,
    convertedBy: artifacts.convertedBy,
  };
};

const assertData = <T>(data: T) => {
  if (!data) {
    throw new StorageError("Failed to fetch expected data from storage");
  }
  return data;
};

const assertDataArray = <T>(data: (undefined | T)[]) => {
  data.forEach((item) => {
    if (!item) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
  });
  return data as T[];
};

const getLocalStorageProject = (): PersistedProjectData | undefined => {
  const data = localStorage.getItem(DATABASE_NAME);
  if (!data) {
    return undefined;
  }
  const dataToMigrate = JSON.parse(data) as { state: PersistedProjectData };
  return {
    ...dataToMigrate.state,
    actions: migrateLegacyActionDataAndAssignNewIds(
      dataToMigrate.state.actions
    ),
  };
};

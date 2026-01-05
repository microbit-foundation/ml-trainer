import { MakeCodeProject } from "@microbit/makecode-embed";
import {
  DBSchema,
  IDBPDatabase,
  IDBPObjectStore,
  IDBPTransaction,
  openDB,
} from "idb";
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

const DATABASE_NAME = "ml";

interface PersistedProjectData {
  id: string;
  actions: ActionData[];
  project: MakeCodeProject;
  projectEdited: boolean;
  settings: Settings;
  timestamp: number | undefined;
}

interface MakeCodeData {
  project: MakeCodeProject;
  projectEdited: boolean;
}

enum DatabaseStore {
  PROJECT_DATA = "project-data",
  MAKECODE_DATA = "makecode-data",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
}

const oldModelUrl = "indexeddb://micro:bit-ai-creator-model";

export class StorageError extends Error {}

const defaultCreatedAt = Date.now();
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

export interface StoreAction extends Action {
  projectId: string;
}

export interface StoreRecordingData extends RecordingData {
  actionId: string;
}

export interface ProjectData {
  id: string;
  name: string;
  timestamp?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectDataWithActions extends ProjectData {
  actions: StoreAction[];
}

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
  [DatabaseStore.MAKECODE_DATA]: {
    key: string;
    value: MakeCodeData;
  };
  [DatabaseStore.SETTINGS]: {
    key: string;
    value: Settings;
  };
}

export class Database {
  dbPromise: Promise<IDBPDatabase<Schema>>;
  projectId: string | undefined;
  dbReady: boolean = false;
  constructor() {
    this.dbPromise = this.initializeDb();
  }

  async useDb(): Promise<IDBPDatabase<Schema>> {
    if (this.dbReady) {
      return this.dbPromise;
    }
    const db = await this.dbPromise;
    const settings = await db.get(
      DatabaseStore.SETTINGS,
      DatabaseStore.SETTINGS
    );
    if (!settings) {
      await this.migrateFromLocalStorage(db);
    }
    this.dbReady = true;
    return db;
  }

  initializeDb(): Promise<IDBPDatabase<Schema>> {
    return openDB(DATABASE_NAME, 1, {
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
  }

  async migrateFromLocalStorage(db: IDBPDatabase<Schema>): Promise<void> {
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
        DatabaseStore.MAKECODE_DATA,
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

    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        timestamp: localStorageProject.timestamp,
        createdAt: defaultCreatedAt,
        updatedAt: defaultCreatedAt,
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
        await model.save(defaultProjectId);
        await tf.io.removeModel(oldModelUrl);
      }
    } catch (err) {
      // There is no model.
    }
    localStorage.removeItem(DATABASE_NAME);
  }

  assertProjectId(): string {
    if (!this.projectId) {
      throw new Error("Project id is unexpectedly undefined");
    }
    return this.projectId;
  }

  async newSession(
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; name: string; id: string }
  ): Promise<void> {
    this.projectId = projectData.id;
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.MAKECODE_DATA, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.add(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.add(
      {
        createdAt: projectData.timestamp,
        updatedAt: projectData.timestamp,
        ...projectData,
      },
      this.projectId
    );
    return tx.done;
  }

  async loadProject(id: string): Promise<PersistedProjectData> {
    this.projectId = id;
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    // Ensure that this project will be loaded by default during next page load.
    await projectDataStore.put(
      { ...projectData, updatedAt: Date.now() },
      this.projectId
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const storeActions = orderBy(
      assertDataArray(
        await actionsStore.index("projectId").getAll(this.projectId)
      ),
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    const makeCodeData = assertData(await makeCodeStore.get(this.projectId));
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
    projectData: { timestamp?: number; id: string },
    settings: Settings
  ): Promise<void> {
    this.projectId = projectData.id;
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
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
      actions.map((a) =>
        actionsStore.add(prepActionForStorage(a, this.projectId!), a.id)
      )
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.add(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    projectData.timestamp = projectData.timestamp ?? Date.now();
    await projectDataStore.add(
      {
        id: this.projectId,
        name: makeCodeData.project.header?.name ?? untitledProjectName,
        createdAt: projectData.timestamp,
        updatedAt: projectData.timestamp,
        timestamp: projectData.timestamp,
      },
      this.projectId
    );

    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    return tx.done;
  }

  async getLatestProjectId(): Promise<string | undefined> {
    const projectData = await (
      await this.useDb()
    ).getAll(DatabaseStore.PROJECT_DATA);
    if (!projectData.length) {
      this.projectId = undefined;
      return undefined;
    }
    const latestProjectData = orderBy(projectData, "updatedAt", "desc")[0];
    this.projectId = latestProjectData.id;
    return this.projectId;
  }

  async getAllProjectData(): Promise<ProjectDataWithActions[]> {
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.ACTIONS, DatabaseStore.PROJECT_DATA],
      "readonly"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = orderBy(
      await projectDataStore.getAll(),
      "updatedAt",
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
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, projectId);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.add(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      projectId
    );
    return tx.done;
  }

  async updateAction(
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, projectId);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.put(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      projectId
    );
    return tx.done;
  }

  async updateActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await Promise.all(
      actions.map((action) =>
        actionsStore.put(prepActionForStorage(action, projectId), action.id)
      )
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      projectId
    );
    return tx.done;
  }

  async deleteAction(
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      { ...projectData, updatedAt: Date.now() },
      projectId
    );
    return tx.done;
  }

  async deleteAllActions(makeCodeData: MakeCodeData): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionIds = await actionsStore
      .index("projectId")
      .getAllKeys(projectId);
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    await projectDataStore.put(
      { ...projectData, updatedAt: Date.now() },
      projectId
    );
    return tx.done;
  }

  async addRecording(
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action, projectId);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.add(
      { ...recording, actionId: action.id },
      recording.id
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    await this.updateProjectInternal(tx);
    return tx.done;
  }

  async deleteRecording(
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action, projectId);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.delete(key);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    await this.updateProjectInternal(tx);
    return tx.done;
  }

  async updateMakeCodeProject(makeCodeData: MakeCodeData): Promise<void> {
    const projectId = this.assertProjectId();
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.MAKECODE_DATA, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
        name: makeCodeData.project.header?.name ?? untitledProjectName,
      },
      projectId
    );
    return tx.done;
  }

  // TODO: TypeScript to ensure that a transaction with DatabaseStore.PROJECT_DATA is passed in.
  private async updateProjectInternal(
    tx: IDBPTransaction<Schema, DatabaseStore[], "readwrite">
  ): Promise<void> {
    const projectId = this.assertProjectId();
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      projectId
    );
  }

  async updateOrCreateProject(
    projectData: { timestamp: number; id: string },
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.MAKECODE_DATA, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    if (this.projectId === projectData.id) {
      const projectData = assertData(
        await projectDataStore.get(this.projectId)
      );
      await projectDataStore.put(
        {
          ...projectData,
          updatedAt: Date.now(),
        },
        this.projectId
      );
      return tx.done;
    }
    this.projectId = projectData.id;
    await projectDataStore.put(
      {
        name: makeCodeData.project.header?.name ?? untitledProjectName,
        createdAt: projectData.timestamp,
        updatedAt: projectData.timestamp,
        ...projectData,
      },
      this.projectId
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    return tx.done;
  }

  async deleteProject(id: string): Promise<PersistedProjectData | boolean> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.delete(id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.delete(id);
    await tx.done;
    if (this.projectId === id) {
      // You've just deleted the project you had loaded, load the next available project.
      const latestProjectId = await this.getLatestProjectId();
      if (!latestProjectId) {
        // There are no other projects in storage. Clear state.
        this.projectId = undefined;
        return true;
      }
      this.projectId = latestProjectId;
      const latestProject = await this.loadProject(latestProjectId);
      return latestProject;
    }
    // Do nothing. You've deleted a project that isn't loaded.
    return false;
  }

  async updateSettings(settings: Settings): Promise<string> {
    return (await this.useDb()).put(
      DatabaseStore.SETTINGS,
      settings,
      DatabaseStore.SETTINGS
    );
  }

  async saveModel(model: tf.LayersModel) {
    const projectId = this.assertProjectId();
    try {
      await model.save(`indexeddb://${projectId}`);
    } catch (err) {
      // IndexedDB not available?
    }
  }

  async removeModel() {
    const projectId = this.assertProjectId();
    try {
      await tf.io.removeModel(`indexeddb://${projectId}`);
    } catch (err) {
      // IndexedDB not available?
    }
  }

  async loadModel(): Promise<tf.LayersModel | undefined> {
    const projectId = this.assertProjectId();
    try {
      return await tf.loadLayersModel(`indexeddb://${projectId}`);
    } catch (err) {
      // There is no model.
      return undefined;
    }
  }
}

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

export const getLocalStorageProject = (): PersistedProjectData | undefined => {
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

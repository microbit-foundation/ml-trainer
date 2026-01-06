import { MakeCodeProject } from "@microbit/makecode-embed";
import { DBSchema, IDBPDatabase, IDBPObjectStore, openDB } from "idb";
import orderBy from "lodash.orderby";
import { v4 as uuid } from "uuid";
import { Action, ActionData, RecordingData } from "./model";
import {
  createUntitledProject,
  migrateLegacyActionData,
} from "./project-utils";
import { defaultSettings, Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";

const DATABASE_NAME = "ml";

interface PersistedProjectData {
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

export class StorageError extends Error {}

const defaultCreatedAt = Date.now();
const defaultProjectId = uuid();

const defaultStoreData: Record<
  | DatabaseStore.PROJECT_DATA
  | DatabaseStore.SETTINGS
  | DatabaseStore.MAKECODE_DATA,
  {
    key: string;
    value: ProjectData | Settings | MakeCodeData;
  }
> = {
  [DatabaseStore.PROJECT_DATA]: {
    value: {
      id: defaultProjectId,
      createdAt: defaultCreatedAt,
      updatedAt: defaultCreatedAt,
    },
    key: defaultProjectId,
  },
  [DatabaseStore.SETTINGS]: {
    value: defaultSettings,
    key: DatabaseStore.SETTINGS,
  },
  [DatabaseStore.MAKECODE_DATA]: {
    value: {
      project: createUntitledProject(),
      projectEdited: false,
    },
    key: defaultProjectId,
  },
};

export interface StoreAction extends Action {
  projectId: string;
}

export interface StoreRecordingData extends RecordingData {
  actionId: string;
}

interface ProjectData {
  id: string;
  timestamp?: number;
  createdAt: number;
  updatedAt: number;
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
  projectId: string = defaultProjectId;
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
      const tx = db.transaction(
        [
          DatabaseStore.MAKECODE_DATA,
          DatabaseStore.PROJECT_DATA,
          DatabaseStore.SETTINGS,
        ],
        "readwrite"
      );
      const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
      const defaultSettings = defaultStoreData[DatabaseStore.SETTINGS];
      await settingsStore.add(
        defaultSettings.value as Settings,
        defaultSettings.key
      );
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
      const defaultMakeCodeProject =
        defaultStoreData[DatabaseStore.MAKECODE_DATA];
      await makeCodeStore.add(
        defaultMakeCodeProject.value as MakeCodeData,
        defaultMakeCodeProject.key
      );
      const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
      const defaultProjectData = defaultStoreData[DatabaseStore.PROJECT_DATA];
      await projectDataStore.add(
        defaultProjectData.value as ProjectData,
        defaultProjectData.key
      );
      return tx.done;
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
      },
      defaultProjectId
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.add(
      localStorageProject.settings,
      DatabaseStore.SETTINGS
    );
    await tx.done;
    localStorage.removeItem(DATABASE_NAME);
  }

  async newSession(
    makeCodeData: MakeCodeData,
    projectData: Partial<ProjectData>
  ): Promise<void> {
    this.projectId = uuid();
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.clear();
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.clear();
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.clear();
    await makeCodeStore.add(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.clear();
    await projectDataStore.add(
      {
        id: this.projectId,
        createdAt: projectData.timestamp!,
        updatedAt: projectData.timestamp!,
        ...projectData,
      },
      this.projectId
    );
    return tx.done;
  }

  async loadProject(id: string): Promise<PersistedProjectData> {
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
    const projectData = assertData(await projectDataStore.get(id));
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
    const makeCodeData = assertData(await makeCodeStore.get(id));
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    const settings = assertData(
      await settingsStore.get(DatabaseStore.SETTINGS)
    );
    await tx.done;
    return {
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
    projectData: Partial<ProjectData>,
    settings: Settings
  ): Promise<void> {
    this.projectId = uuid();
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
    await recordingsStore.clear();
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.clear();
    await Promise.all(
      actions
        .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
        .map((r) => recordingsStore.add(r, r.id))
    );
    await Promise.all(
      actions.map((a) =>
        actionsStore.add(prepActionForStorage(a, this.projectId), a.id)
      )
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.clear();
    await makeCodeStore.add(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    await projectDataStore.clear();
    const createdAt = Date.now();
    await projectDataStore.add(
      {
        id: this.projectId,
        createdAt,
        updatedAt: createdAt,
        ...projectData,
      },
      this.projectId
    );

    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    return tx.done;
  }

  async getLatestProjectId(): Promise<string> {
    const projectData = await (
      await this.useDb()
    ).getAll(DatabaseStore.PROJECT_DATA);
    const latestProjectData = orderBy(projectData, "updatedAt", "desc")[0];
    this.projectId = latestProjectData.id;
    return this.projectId;
  }

  async addAction(
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, this.projectId);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.add(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async updateAction(
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, this.projectId);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.put(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async updateActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData
  ): Promise<void> {
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
        actionsStore.put(
          prepActionForStorage(action, this.projectId),
          action.id
        )
      )
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async deleteAction(
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
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
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      { ...projectData, updatedAt: Date.now() },
      this.projectId
    );
    return tx.done;
  }

  async deleteAllActions(makeCodeData: MakeCodeData): Promise<void> {
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
    const projectData = assertData(await projectDataStore.get(this.projectId));
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionIds = await actionsStore
      .index("projectId")
      .getAllKeys(this.projectId);
    await Promise.all(actionIds.map((id) => actionsStore.delete(id)));
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordingIds = (
      await Promise.all(
        actionIds.map((id) => recordingsStore.index("actionId").getAllKeys(id))
      )
    ).flat();
    await Promise.all(recordingIds.map((id) => recordingsStore.delete(id)));
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    await projectDataStore.put(
      { ...projectData, updatedAt: Date.now() },
      this.projectId
    );
    return tx.done;
  }

  async addRecording(
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
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
    const actionToStore = prepActionForStorage(action, this.projectId);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.add(
      { ...recording, actionId: action.id },
      recording.id
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async deleteRecording(
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData
  ): Promise<void> {
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
    const actionToStore = prepActionForStorage(action, this.projectId);
    await actionsStore.put(actionToStore, actionToStore.id);
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.delete(key);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async updateMakeCodeProject(makeCodeData: MakeCodeData): Promise<void> {
    const tx = (await this.useDb()).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.RECORDINGS,
      ],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
    await makeCodeStore.put(makeCodeData, this.projectId);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(this.projectId));
    await projectDataStore.put(
      {
        ...projectData,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  // Currently unused.
  async updateProject(project: Partial<ProjectData>): Promise<void> {
    const tx = (await this.useDb()).transaction(
      DatabaseStore.PROJECT_DATA,
      "readwrite"
    );
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const storedProjectData = assertData(
      await projectDataStore.get(this.projectId)
    );
    await projectDataStore.put(
      {
        ...storedProjectData,
        ...project,
        updatedAt: Date.now(),
      },
      this.projectId
    );
    return tx.done;
  }

  async updateSettings(settings: Settings): Promise<string> {
    return (await this.useDb()).put(
      DatabaseStore.SETTINGS,
      settings,
      DatabaseStore.SETTINGS
    );
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
    actions: migrateLegacyActionData(dataToMigrate.state.actions),
  };
};

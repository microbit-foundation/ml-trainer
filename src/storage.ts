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
import { flags } from "./flags";

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
  dbInitValuesPromise: PromiseInfo<void> | undefined;
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
        await model.save(defaultProjectId);
        await tf.io.removeModel(oldModelUrl);
      }
    } catch (err) {
      // There is no model.
    }
    localStorage.removeItem(DATABASE_NAME);
  }

  async newSession(
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; name: string; id: string }
  ): Promise<void> {
    const id = projectData.id;
    if (flags.multipleProjects) {
      const tx = (await this.useDb()).transaction(
        [DatabaseStore.MAKECODE_DATA, DatabaseStore.PROJECT_DATA],
        "readwrite"
      );
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
      await makeCodeStore.add(makeCodeData, id);
      const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
      await projectDataStore.add(projectData, id);
      return tx.done;
    } else {
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
      await actionsStore.clear();
      const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
      await recordingsStore.clear();
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
      await makeCodeStore.clear();
      await makeCodeStore.add(makeCodeData, id);
      const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
      await projectDataStore.clear();
      await projectDataStore.add(projectData, id);
      return tx.done;
    }
  }

  async getProject(id: string): Promise<PersistedProjectData> {
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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

  // This method is used passively. Don't update the project timestamp.
  async getLatestProject(): Promise<PersistedProjectData | undefined> {
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
    const allProjectsData = await projectDataStore.getAll();
    if (!allProjectsData.length) {
      return undefined;
    }
    const projectData = orderBy(allProjectsData, "updatedAt", "desc")[0];
    const id = projectData.id;
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
    if (flags.multipleProjects) {
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
        actions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
      );
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
    } else {
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
      await Promise.all(
        actions
          .flatMap((a) => a.recordings.map((r) => ({ ...r, actionId: a.id })))
          .map((r) => recordingsStore.add(r, r.id))
      );
      const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
      await actionsStore.clear();
      await Promise.all(
        actions.map((a) => actionsStore.add(prepActionForStorage(a, id), a.id))
      );
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
      await makeCodeStore.clear();
      await makeCodeStore.add(makeCodeData, id);
      const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
      await projectDataStore.clear();
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
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, id);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.add(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        DatabaseStore.MAKECODE_DATA,
        DatabaseStore.PROJECT_DATA,
      ],
      "readwrite"
    );
    const actionToStore = prepActionForStorage(action, id);
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.put(actionToStore, actionToStore.id);
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
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
    await makeCodeStore.put(makeCodeData, id);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put({ ...projectData, timestamp }, id);
    return tx.done;
  }

  async deleteAllActions(
    id: string | undefined,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
        DatabaseStore.MAKECODE_DATA,
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
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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
      [DatabaseStore.MAKECODE_DATA, DatabaseStore.PROJECT_DATA],
      "readwrite"
    );
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE_DATA);
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

  async deleteProject(id: string): Promise<void> {
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
  }

  async updateSettings(
    id: string | undefined,
    settings: Settings,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const tx = (await this.useDb()).transaction(
      [DatabaseStore.PROJECT_DATA, DatabaseStore.SETTINGS],
      "readwrite"
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    await settingsStore.put(settings, DatabaseStore.SETTINGS);
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = assertData(await projectDataStore.get(id));
    await projectDataStore.put({
      ...projectData,
      timestamp,
    });
    return tx.done;
  }

  async saveModel(id: string | undefined, model: tf.LayersModel) {
    id = this.assertProjectId(id);
    try {
      await model.save(`indexeddb://${id}`);
    } catch (err) {
      // IndexedDB not available?
    }
  }

  async removeModel(id: string | undefined) {
    id = this.assertProjectId(id);
    try {
      await tf.io.removeModel(`indexeddb://${id}`);
    } catch (err) {
      // IndexedDB not available?
    }
  }

  async loadModel(id: string): Promise<tf.LayersModel | undefined> {
    try {
      return await tf.loadLayersModel(`indexeddb://${id}`);
    } catch (err) {
      // There is no model.
      return undefined;
    }
  }

  assertProjectId(id: string | undefined) {
    if (!id) {
      throw new StorageError("Project id is undefined");
    }
    return id;
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

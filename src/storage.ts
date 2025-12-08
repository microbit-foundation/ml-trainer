import { MakeCodeProject } from "@microbit/makecode-embed";
import { openDB, IDBPDatabase, DBSchema } from "idb";
import { Action, ActionData, RecordingData } from "./model";
import { defaultSettings, Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";

const DATABASE_NAME = "ml";

export enum DatabaseStore {
  PROJECT_DATA = "project-data",
  MAKECODE = "makecode",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
}

const defaultStoreData: Record<
  DatabaseStore.PROJECT_DATA | DatabaseStore.SETTINGS,
  { key: string; value: ProjectData | Settings }
> = {
  [DatabaseStore.PROJECT_DATA]: {
    value: { timestamp: undefined, projectEdited: false },
    key: "project-data",
  },
  [DatabaseStore.SETTINGS]: {
    value: defaultSettings,
    key: "settings",
  },
};

export interface StoreAction extends Action {
  recordingIds: string[];
}

interface ProjectData {
  projectEdited: boolean;
  timestamp?: number;
}

interface Schema extends DBSchema {
  [DatabaseStore.PROJECT_DATA]: {
    key: string;
    value: ProjectData;
  };
  [DatabaseStore.ACTIONS]: {
    key: string;
    value: StoreAction;
  };
  [DatabaseStore.RECORDINGS]: {
    key: string;
    value: RecordingData;
  };
  [DatabaseStore.MAKECODE]: {
    key: string;
    value: MakeCodeProject;
  };
  [DatabaseStore.SETTINGS]: {
    key: string;
    value: Settings;
  };
}

export class Database {
  dbPromise: Promise<IDBPDatabase<Schema>>;
  constructor() {
    this.dbPromise = this.initialize();
  }

  initialize(): Promise<IDBPDatabase<Schema>> {
    return openDB(DATABASE_NAME, 1, {
      async upgrade(db) {
        for (const store of Object.values(DatabaseStore)) {
          const objectStore = db.createObjectStore(store);
          if (
            store === DatabaseStore.PROJECT_DATA ||
            store === DatabaseStore.SETTINGS
          ) {
            // TODO: Migrate from localStorage.
            const defaultData = defaultStoreData[store];
            await objectStore.add(defaultData.value, defaultData.key);
          }
        }
      },
    });
  }

  async getProjectData(): Promise<ProjectData> {
    const projectData = await (
      await this.dbPromise
    ).get(DatabaseStore.PROJECT_DATA, "project-data");
    if (!projectData) {
      throw new Error("Failed to fetch project data");
    }
    return projectData;
  }

  async updateProjectData(projectData: ProjectData): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.PROJECT_DATA,
      projectData,
      "project-data"
    );
  }

  async getActions(): Promise<ActionData[]> {
    const tx = (await this.dbPromise).transaction(
      [DatabaseStore.ACTIONS, DatabaseStore.RECORDINGS],
      "readonly"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const storeActions = await actionsStore.getAll();
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordings = (await recordingsStore.getAll()).reverse();
    await tx.done;
    const actions: ActionData[] = storeActions.map((action) => {
      return {
        ...action,
        recordings: recordings.filter((rec) =>
          action.recordingIds.includes(rec.ID.toString())
        ),
      };
    });
    return actions;
  }

  async addAction(action: ActionData): Promise<string> {
    const actionToStore = prepActionForStorage(action);
    return (await this.dbPromise).add(
      DatabaseStore.ACTIONS,
      actionToStore,
      actionToStore.ID.toString()
    );
  }

  async updateAction(action: ActionData): Promise<string> {
    const actionToStore = prepActionForStorage(action);
    return (await this.dbPromise).put(
      DatabaseStore.ACTIONS,
      actionToStore,
      actionToStore.ID.toString()
    );
  }

  async deleteAction(key: string): Promise<void> {
    return (await this.dbPromise).delete(DatabaseStore.ACTIONS, key);
  }

  async deleteAllActions(): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      DatabaseStore.ACTIONS,
      "readwrite"
    );
    const store = tx.objectStore(DatabaseStore.ACTIONS);
    const keys = await store.getAllKeys();
    const promises: Promise<void>[] = [];
    keys.forEach((key) => promises.push(store.delete(key)));
    await Promise.all(promises);
    return tx.done;
  }

  async addRecording(
    recording: RecordingData,
    action: ActionData
  ): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      [DatabaseStore.RECORDINGS, DatabaseStore.ACTIONS],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action);
    await actionsStore.put(actionToStore, actionToStore.ID.toString());
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.add(recording, recording.ID.toString());
    return tx.done;
  }

  async deleteRecording(key: string, action: ActionData): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      [DatabaseStore.RECORDINGS, DatabaseStore.ACTIONS],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const actionToStore = prepActionForStorage(action);
    await actionsStore.put(actionToStore, actionToStore.ID.toString());
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.delete(key);
    return tx.done;
  }

  async getSettings(): Promise<Settings> {
    const settings = await (
      await this.dbPromise
    ).get(DatabaseStore.SETTINGS, "settings");
    if (!settings) {
      throw new Error("Failed to fetch settings");
    }
    return settings;
  }

  async updateSettings(settings: Settings): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.SETTINGS,
      settings,
      "settings"
    );
  }
}

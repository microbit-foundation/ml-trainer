import { MakeCodeProject } from "@microbit/makecode-embed";
import { openDB, IDBPDatabase, DBSchema } from "idb";
import { Action, ActionData, RecordingData } from "./model";
import { Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";

// Meed a custom migraton from current localStorage to IndexedDB - one project only.

const DATABASE_NAME = "ml";

export enum DatabaseStore {
  PROJECT = "project",
  MAKECODE = "makecode",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
}

export interface StoreAction extends Action {
  recordingIds: string[];
}

interface Schema extends DBSchema {
  [DatabaseStore.PROJECT]: {
    key: string;
    value: string;
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
      upgrade(db) {
        for (const store of Object.values(DatabaseStore)) {
          db.createObjectStore(store);
        }
      },
    });
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

  async addRecording(recording: RecordingData): Promise<string> {
    return (await this.dbPromise).add(
      DatabaseStore.RECORDINGS,
      recording,
      recording.ID.toString()
    );
  }

  async deleteRecording(key: string): Promise<void> {
    return (await this.dbPromise).delete(DatabaseStore.RECORDINGS, key);
  }
}

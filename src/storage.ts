import { MakeCodeProject } from "@microbit/makecode-embed";
import { openDB, IDBPDatabase, DBSchema } from "idb";
import { Action, ActionData, RecordingData } from "./model";
import { defaultSettings, Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";
import { createUntitledProject } from "./project-utils";

const DATABASE_NAME = "ml";

interface PersistedData {
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

export enum DatabaseStore {
  PROJECT_DATA = "project-data",
  MAKECODE = "makecode-project",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
}

const defaultStoreData: Record<
  DatabaseStore.PROJECT_DATA | DatabaseStore.SETTINGS | DatabaseStore.MAKECODE,
  { key: string; value: ProjectData | Settings | MakeCodeData }
> = {
  [DatabaseStore.PROJECT_DATA]: {
    value: { timestamp: undefined, projectEdited: false },
    key: DatabaseStore.PROJECT_DATA,
  },
  [DatabaseStore.SETTINGS]: {
    value: defaultSettings,
    key: DatabaseStore.SETTINGS,
  },
  [DatabaseStore.MAKECODE]: {
    value: {
      project: createUntitledProject(),
      projectEdited: false,
    },
    key: DatabaseStore.MAKECODE,
  },
};

export interface StoreAction extends Action {
  recordingIds: string[];
}

interface ProjectData {
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
    value: MakeCodeData;
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
        let dataToMigrate: { state: PersistedData } | undefined;
        const data = localStorage.getItem("ml");
        if (data) {
          dataToMigrate = JSON.parse(data) as { state: PersistedData };
        }
        for (const store of Object.values(DatabaseStore)) {
          const objectStore = db.createObjectStore(store);
          if (dataToMigrate) {
            const { state } = dataToMigrate;
            switch (store) {
              case DatabaseStore.ACTIONS: {
                await Promise.all(
                  state.actions.map((a) =>
                    objectStore.add(prepActionForStorage(a), a.ID.toString())
                  )
                );
                break;
              }
              case DatabaseStore.RECORDINGS: {
                await Promise.all(
                  state.actions
                    .flatMap((a) => a.recordings)
                    .map((r) => objectStore.add(r, r.ID.toString()))
                );
                break;
              }
              case DatabaseStore.MAKECODE: {
                await objectStore.add(
                  {
                    project: state.project,
                    projectEdited: state.projectEdited,
                  },
                  DatabaseStore.MAKECODE
                );
                break;
              }
              case DatabaseStore.PROJECT_DATA: {
                await objectStore.add(
                  { timestamp: state.timestamp },
                  DatabaseStore.PROJECT_DATA
                );
                break;
              }
              case DatabaseStore.SETTINGS: {
                await objectStore.add(state.settings, DatabaseStore.SETTINGS);
                break;
              }
            }
            continue;
          }
          // Set default values if there is are data to migrate.
          if (
            store === DatabaseStore.PROJECT_DATA ||
            store === DatabaseStore.MAKECODE ||
            store === DatabaseStore.SETTINGS
          ) {
            const defaultData = defaultStoreData[store];
            await objectStore.add(defaultData.value, defaultData.key);
          }
        }
      },
    });
  }

  async loadProject(): Promise<PersistedData> {
    const tx = (await this.dbPromise).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readonly"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    const storeActions = await actionsStore.getAll();
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    const recordings = (await recordingsStore.getAll()).reverse();
    const actions: ActionData[] = storeActions.map((action) => {
      return {
        ...action,
        recordings: recordings.filter((rec) =>
          action.recordingIds.includes(rec.ID.toString())
        ),
      };
    });
    const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE);
    const makeCodeData = await makeCodeStore.get(DatabaseStore.MAKECODE);
    if (!makeCodeData) {
      throw new Error("Failed to fetch MakeCode data");
    }
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    const projectData = await projectDataStore.get(DatabaseStore.PROJECT_DATA);
    if (!projectData) {
      throw new Error("Failed to fetch project data");
    }
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    const settings = await settingsStore.get(DatabaseStore.SETTINGS);
    if (!settings) {
      throw new Error("Failed to fetch settings");
    }
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
    actions: ActionData[] | undefined,
    makeCodeData: MakeCodeData | undefined,
    projectData: ProjectData,
    settings: Settings
  ): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      [
        DatabaseStore.ACTIONS,
        DatabaseStore.RECORDINGS,
        DatabaseStore.MAKECODE,
        DatabaseStore.PROJECT_DATA,
        DatabaseStore.SETTINGS,
      ],
      "readwrite"
    );
    const storePromises: Promise<string>[] = [];
    if (actions) {
      const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
      await recordingsStore.clear();
      const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
      await actionsStore.clear();
      storePromises.push(
        ...actions
          .flatMap((a) => a.recordings)
          .map((r) => recordingsStore.add(r, r.ID.toString()))
      );
      storePromises.push(
        ...actions.map((a) =>
          actionsStore.add(prepActionForStorage(a), a.ID.toString())
        )
      );
    }
    if (makeCodeData) {
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE);
      storePromises.push(
        makeCodeStore.put(makeCodeData, DatabaseStore.MAKECODE)
      );
    }
    const projectDataStore = tx.objectStore(DatabaseStore.PROJECT_DATA);
    storePromises.push(
      projectDataStore.put(projectData, DatabaseStore.PROJECT_DATA)
    );
    const settingsStore = tx.objectStore(DatabaseStore.SETTINGS);
    storePromises.push(settingsStore.put(settings, DatabaseStore.SETTINGS));
    await Promise.all(storePromises);
    return tx.done;
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

  async deleteAction(action: ActionData): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      [DatabaseStore.ACTIONS, DatabaseStore.RECORDINGS],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.delete(action.ID.toString());
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await Promise.all([
      action.recordings.map((r) => recordingsStore.delete(r.ID.toString())),
    ]);
    return tx.done;
  }

  async deleteAllActions(): Promise<void> {
    const tx = (await this.dbPromise).transaction(
      [DatabaseStore.ACTIONS, DatabaseStore.RECORDINGS],
      "readwrite"
    );
    const actionsStore = tx.objectStore(DatabaseStore.ACTIONS);
    await actionsStore.clear();
    const recordingsStore = tx.objectStore(DatabaseStore.RECORDINGS);
    await recordingsStore.clear();
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

  async updateMakeCodeProject(makeCodeData: MakeCodeData): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.MAKECODE,
      makeCodeData,
      DatabaseStore.MAKECODE
    );
  }

  async updateProjectData(projectData: ProjectData): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.PROJECT_DATA,
      projectData,
      DatabaseStore.PROJECT_DATA
    );
  }

  async updateSettings(settings: Settings): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.SETTINGS,
      settings,
      DatabaseStore.SETTINGS
    );
  }
}

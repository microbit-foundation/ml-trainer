import { MakeCodeProject } from "@microbit/makecode-embed";
import { openDB, IDBPDatabase, DBSchema } from "idb";
import { Action, ActionData, RecordingData } from "./model";
import { defaultSettings, Settings } from "./settings";
import { prepActionForStorage } from "./storageUtils";
import { createUntitledProject } from "./project-utils";

const DATABASE_NAME = "ml";

export enum DatabaseStore {
  PROJECT_DATA = "project-data",
  MAKECODE = "makecode-project",
  RECORDINGS = "recordings",
  ACTIONS = "actions",
  SETTINGS = "settings",
}

const defaultStoreData: Record<
  DatabaseStore.PROJECT_DATA | DatabaseStore.SETTINGS | DatabaseStore.MAKECODE,
  { key: string; value: ProjectData | Settings | MakeCodeProject }
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
    value: createUntitledProject(),
    key: DatabaseStore.MAKECODE,
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
            store === DatabaseStore.MAKECODE ||
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
    // const actionKeys = await store.getAllKeys();
    // await Promise.all(actionKeys.map((k) => store.delete(k)));
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

  async getMakeCodeProject(): Promise<MakeCodeProject> {
    const makeCodeProject = await (
      await this.dbPromise
    ).get(DatabaseStore.MAKECODE, DatabaseStore.MAKECODE);
    if (!makeCodeProject) {
      throw new Error("Failed to fetch MakeCode project");
    }
    return makeCodeProject;
  }

  async updateMakeCodeProject(project: MakeCodeProject): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.MAKECODE,
      project,
      DatabaseStore.MAKECODE
    );
  }

  async getProjectData(): Promise<ProjectData> {
    const projectData = await (
      await this.dbPromise
    ).get(DatabaseStore.PROJECT_DATA, DatabaseStore.PROJECT_DATA);
    if (!projectData) {
      throw new Error("Failed to fetch project data");
    }
    return projectData;
  }

  async updateProjectData(projectData: ProjectData): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.PROJECT_DATA,
      projectData,
      DatabaseStore.PROJECT_DATA
    );
  }

  async getSettings(): Promise<Settings> {
    const settings = await (
      await this.dbPromise
    ).get(DatabaseStore.SETTINGS, DatabaseStore.SETTINGS);
    if (!settings) {
      throw new Error("Failed to fetch settings");
    }
    return settings;
  }

  async updateSettings(settings: Settings): Promise<string> {
    return (await this.dbPromise).put(
      DatabaseStore.SETTINGS,
      settings,
      DatabaseStore.SETTINGS
    );
  }

  async importProject(
    actions: ActionData[] | undefined,
    makeCodeProject: MakeCodeProject | undefined,
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
    if (makeCodeProject) {
      const makeCodeStore = tx.objectStore(DatabaseStore.MAKECODE);
      storePromises.push(
        makeCodeStore.put(makeCodeProject, DatabaseStore.MAKECODE)
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
}

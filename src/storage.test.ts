/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import * as tf from "@tensorflow/tfjs";
import { v4 as uuid } from "uuid";
import { ActionData, RecordingData } from "./model";
import { DataSamplesView } from "./model";
import { Settings } from "./settings";
import { Database, IdbDatabase, MakeCodeData } from "./storage";
import { SqliteDatabase } from "./sqlite-storage";
import { createBetterSqlite3Connection } from "./testing/better-sqlite3-adapter";

const testSettings: Settings = {
  languageId: "en",
  showPreSaveHelp: true,
  showPreTrainHelp: true,
  showPreDownloadHelp: true,
  toursCompleted: [],
  dataSamplesView: DataSamplesView.Graph,
  showGraphs: true,
  graphColorScheme: "default",
  graphLineScheme: "solid",
  graphLineWeight: "default",
};

const makeRecording = (): RecordingData => ({
  id: uuid(),
  data: { x: [1, 2, 3], y: [4, 5, 6], z: [7, 8, 9] },
  createdAt: Date.now(),
});

const makeAction = (
  overrides: Partial<ActionData> = {},
  numRecordings = 0
): ActionData => ({
  id: uuid(),
  name: `Action ${Date.now()}`,
  icon: "Heart",
  requiredConfidence: undefined,
  createdAt: Date.now(),
  recordings: Array.from({ length: numRecordings }, () => makeRecording()),
  ...overrides,
});

const makeMakeCodeData = (name = "Test Project"): MakeCodeData => ({
  project: {
    header: { name } as MakeCodeData["project"]["header"],
    text: {},
  },
  projectEdited: false,
});

const makeProjectData = (name = "Test Project") => ({
  id: uuid(),
  name,
  timestamp: Date.now(),
});

interface BackendConfig {
  name: string;
  factory: () => Database;
  cleanup: () => Promise<void>;
}

/**
 * Close the internal IDB connection and delete the database so each
 * test starts fresh. We access the private `dbPromise` field to close
 * the connection before calling `deleteDatabase`, which otherwise blocks
 * until the connection is released.
 */
const cleanupIdb = async (db: Database) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idbDb = await (db as any).dbPromise;
  idbDb.close();
  const req = indexedDB.deleteDatabase("ml");
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

const backends: BackendConfig[] = [
  {
    name: "IdbDatabase",
    factory: () => new IdbDatabase(),
    cleanup: async () => {
      // Cleanup is handled via cleanupIdb in afterEach which needs the db ref.
    },
  },
  {
    name: "SqliteDatabase",
    factory: () => new SqliteDatabase(createBetterSqlite3Connection()),
    cleanup: async () => {
      // Each test gets a fresh :memory: database; nothing to clean up.
    },
  },
];

describe.each(backends)("$name", ({ name, factory }) => {
  let db: Database;

  // IdbDatabase migration logic calls tf.loadLayersModel which needs a backend.
  beforeAll(async () => {
    await tf.setBackend("cpu");
    await tf.ready();
  });

  beforeEach(() => {
    db = factory();
  });

  afterEach(async () => {
    if (name === "IdbDatabase") {
      await cleanupIdb(db);
    }
  });

  describe("newSession + getProject", () => {
    it("round-trips project data", async () => {
      const actions = [
        makeAction({ createdAt: 1000 }, 2),
        makeAction({ createdAt: 2000 }, 1),
      ];
      const makeCodeData = makeMakeCodeData();
      const projectData = makeProjectData();

      await db.newSession(actions, makeCodeData, projectData);
      const loaded = await db.getProject(projectData.id);

      expect(loaded.id).toBe(projectData.id);
      expect(loaded.actions).toHaveLength(2);
      expect(loaded.actions[0].id).toBe(actions[0].id);
      expect(loaded.actions[0].name).toBe(actions[0].name);
      expect(loaded.actions[0].icon).toBe(actions[0].icon);
      expect(loaded.actions[0].recordings).toHaveLength(2);
      expect(loaded.actions[0].recordings[0].data).toEqual(
        actions[0].recordings[0].data
      );
      expect(loaded.actions[1].recordings).toHaveLength(1);
      expect(loaded.project.header?.name).toBe("Test Project");
      expect(loaded.projectEdited).toBe(false);
      expect(loaded.settings).toBeDefined();
    });

    it("preserves requiredConfidence", async () => {
      const actions = [makeAction({ requiredConfidence: 0.8 })];
      const makeCodeData = makeMakeCodeData();
      const projectData = makeProjectData();

      await db.newSession(actions, makeCodeData, projectData);
      const loaded = await db.getProject(projectData.id);

      expect(loaded.actions[0].requiredConfidence).toBe(0.8);
    });
  });

  describe("getLatestProject", () => {
    it("returns undefined for empty database", async () => {
      const result = await db.getLatestProject();
      expect(result).toBeUndefined();
    });

    it("returns most recent project", async () => {
      const older = makeProjectData("Older");
      older.timestamp = 1000;
      await db.newSession([makeAction()], makeMakeCodeData("Older"), older);

      const newer = makeProjectData("Newer");
      newer.timestamp = 2000;
      await db.newSession([makeAction()], makeMakeCodeData("Newer"), newer);

      const result = await db.getLatestProject();
      expect(result).toBeDefined();
      expect(result!.id).toBe(newer.id);
    });
  });

  describe("getAllProjectData", () => {
    it("returns empty array for empty database", async () => {
      const result = await db.getAllProjectData();
      expect(result).toEqual([]);
    });

    it("returns all projects with actions", async () => {
      const p1 = makeProjectData("P1");
      p1.timestamp = 2000;
      const p1Actions = [makeAction({ name: "Wave" })];
      await db.newSession(p1Actions, makeMakeCodeData("P1"), p1);

      const p2 = makeProjectData("P2");
      p2.timestamp = 3000;
      const p2Actions = [
        makeAction({ name: "Shake" }),
        makeAction({ name: "Tilt" }),
      ];
      await db.newSession(p2Actions, makeMakeCodeData("P2"), p2);

      const result = await db.getAllProjectData();
      // Ordered by timestamp desc
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(p2.id);
      expect(result[0].actions).toHaveLength(2);
      expect(result[1].id).toBe(p1.id);
      expect(result[1].actions).toHaveLength(1);
    });
  });

  describe("importProject", () => {
    it("imports project with settings", async () => {
      const actions = [makeAction({}, 1)];
      const makeCodeData = makeMakeCodeData("Imported");
      const projectData = { id: uuid(), timestamp: Date.now() };
      const settings: Settings = {
        ...testSettings,
        languageId: "fr",
      };

      await db.importProject(actions, makeCodeData, projectData, settings);
      const loaded = await db.getProject(projectData.id);

      expect(loaded.id).toBe(projectData.id);
      expect(loaded.actions).toHaveLength(1);
      expect(loaded.actions[0].recordings).toHaveLength(1);
      expect(loaded.project.header?.name).toBe("Imported");
      expect(loaded.settings.languageId).toBe("fr");
    });
  });

  describe("action CRUD", () => {
    let projectId: string;
    let initialAction: ActionData;

    beforeEach(async () => {
      initialAction = makeAction({ name: "Initial" });
      const makeCodeData = makeMakeCodeData();
      const projectData = makeProjectData();
      projectId = projectData.id;
      await db.newSession([initialAction], makeCodeData, projectData);
    });

    it("addAction adds a new action", async () => {
      const newAction = makeAction({ name: "New" });
      await db.addAction(projectId, newAction, makeMakeCodeData(), Date.now());

      const loaded = await db.getProject(projectId);
      expect(loaded.actions).toHaveLength(2);
      expect(loaded.actions.find((a) => a.id === newAction.id)).toBeDefined();
    });

    it("updateAction updates an existing action", async () => {
      const updated = {
        ...initialAction,
        name: "Updated Name",
        icon: "Happy" as const,
      };
      await db.updateAction(projectId, updated, makeMakeCodeData(), Date.now());

      const loaded = await db.getProject(projectId);
      const action = loaded.actions.find((a) => a.id === initialAction.id);
      expect(action?.name).toBe("Updated Name");
      expect(action?.icon).toBe("Happy");
    });

    it("updateActions updates multiple actions", async () => {
      const second = makeAction({ name: "Second" });
      await db.addAction(projectId, second, makeMakeCodeData(), Date.now());

      const updates = [
        { ...initialAction, name: "A1 Updated" },
        { ...second, name: "A2 Updated" },
      ];
      await db.updateActions(
        projectId,
        updates,
        makeMakeCodeData(),
        Date.now()
      );

      const loaded = await db.getProject(projectId);
      expect(loaded.actions.find((a) => a.id === initialAction.id)?.name).toBe(
        "A1 Updated"
      );
      expect(loaded.actions.find((a) => a.id === second.id)?.name).toBe(
        "A2 Updated"
      );
    });

    it("deleteAction removes an action and its recordings", async () => {
      const withRecording = makeAction({ name: "ToDelete" }, 2);
      await db.addAction(
        projectId,
        withRecording,
        makeMakeCodeData(),
        Date.now()
      );

      // Delete the action, passing empty newActions (no replacement)
      await db.deleteAction(
        projectId,
        withRecording,
        [],
        makeMakeCodeData(),
        Date.now()
      );

      const loaded = await db.getProject(projectId);
      expect(
        loaded.actions.find((a) => a.id === withRecording.id)
      ).toBeUndefined();
    });

    it("deleteAllActions replaces with new default actions", async () => {
      const replacement = makeAction({ name: "Fresh" });
      await db.deleteAllActions(
        projectId,
        [replacement],
        makeMakeCodeData(),
        Date.now()
      );

      const loaded = await db.getProject(projectId);
      expect(loaded.actions).toHaveLength(1);
      expect(loaded.actions[0].id).toBe(replacement.id);
    });
  });

  describe("recordings", () => {
    let projectId: string;
    let action: ActionData;

    beforeEach(async () => {
      action = makeAction({ name: "Rec Test" });
      const projectData = makeProjectData();
      projectId = projectData.id;
      await db.newSession([action], makeMakeCodeData(), projectData);
    });

    it("addRecording adds a recording to an action", async () => {
      const recording = makeRecording();
      const updatedAction = {
        ...action,
        recordings: [recording],
      };

      await db.addRecording(
        projectId,
        recording,
        updatedAction,
        makeMakeCodeData(),
        Date.now()
      );

      const loaded = await db.getProject(projectId);
      const loadedAction = loaded.actions.find((a) => a.id === action.id);
      expect(loadedAction?.recordings).toHaveLength(1);
      expect(loadedAction?.recordings[0].id).toBe(recording.id);
      expect(loadedAction?.recordings[0].data).toEqual(recording.data);
    });

    it("deleteRecording removes a specific recording", async () => {
      const r1 = makeRecording();
      const r2 = makeRecording();
      const updatedAction = {
        ...action,
        recordings: [r1, r2],
      };

      await db.addRecording(
        projectId,
        r1,
        { ...action, recordings: [r1] },
        makeMakeCodeData(),
        Date.now()
      );
      await db.addRecording(
        projectId,
        r2,
        updatedAction,
        makeMakeCodeData(),
        Date.now()
      );

      // Delete r1, keeping r2
      const afterDelete = { ...action, recordings: [r2] };
      await db.deleteRecording(
        projectId,
        r1.id,
        afterDelete,
        makeMakeCodeData(),
        Date.now()
      );

      const loaded = await db.getProject(projectId);
      const loadedAction = loaded.actions.find((a) => a.id === action.id);
      expect(loadedAction?.recordings).toHaveLength(1);
      expect(loadedAction?.recordings[0].id).toBe(r2.id);
    });
  });

  describe("replaceActions", () => {
    it("replaces all actions for a project", async () => {
      const projectData = makeProjectData();
      await db.newSession(
        [makeAction({ name: "Old" })],
        makeMakeCodeData(),
        projectData
      );

      const newActions = [
        makeAction({ name: "New1", createdAt: 1000 }, 1),
        makeAction({ name: "New2", createdAt: 2000 }),
      ];
      const newMakeCode = makeMakeCodeData("Replaced");

      await db.replaceActions(
        newActions,
        newMakeCode,
        { timestamp: Date.now(), id: projectData.id },
        testSettings
      );

      const loaded = await db.getProject(projectData.id);
      expect(loaded.actions).toHaveLength(2);
      expect(loaded.actions[0].name).toBe("New1");
      expect(loaded.actions[0].recordings).toHaveLength(1);
      expect(loaded.actions[1].name).toBe("New2");
    });
  });

  describe("renameProject", () => {
    it("updates project name and MakeCode header", async () => {
      const projectData = makeProjectData("Original");
      await db.newSession(
        [makeAction()],
        makeMakeCodeData("Original"),
        projectData
      );

      await db.renameProject(projectData.id, "Renamed", Date.now());

      const loaded = await db.getProject(projectData.id);
      expect(loaded.project.header?.name).toBe("Renamed");

      const allProjects = await db.getAllProjectData();
      expect(allProjects.find((p) => p.id === projectData.id)?.name).toBe(
        "Renamed"
      );
    });
  });

  describe("duplicateProject", () => {
    it("clones project with new IDs", async () => {
      const actions = [makeAction({ name: "Dup Action" }, 2)];
      const projectData = makeProjectData("Source");
      await db.newSession(actions, makeMakeCodeData("Source"), projectData);

      const newId = uuid();
      await db.duplicateProject(projectData.id, {
        id: newId,
        name: "Clone",
        timestamp: Date.now(),
      });

      const clone = await db.getProject(newId);
      expect(clone.id).toBe(newId);
      expect(clone.project.header?.name).toBe("Clone");
      expect(clone.actions).toHaveLength(1);
      // New action IDs
      expect(clone.actions[0].id).not.toBe(actions[0].id);
      expect(clone.actions[0].name).toBe("Dup Action");
      expect(clone.actions[0].recordings).toHaveLength(2);
      // Recording IDs are new too
      expect(clone.actions[0].recordings[0].id).not.toBe(
        actions[0].recordings[0].id
      );
      // But recording data is preserved
      expect(clone.actions[0].recordings[0].data).toEqual(
        actions[0].recordings[0].data
      );

      // Source project is untouched
      const source = await db.getProject(projectData.id);
      expect(source.actions[0].id).toBe(actions[0].id);
    });
  });

  describe("deleteProject / deleteProjects", () => {
    it("deleteProject removes all related data", async () => {
      const p1 = makeProjectData("Keep");
      await db.newSession([makeAction()], makeMakeCodeData("Keep"), p1);

      const p2 = makeProjectData("Delete");
      await db.newSession([makeAction({}, 2)], makeMakeCodeData("Delete"), p2);

      await db.deleteProject(p2.id);

      const all = await db.getAllProjectData();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(p1.id);
    });

    it("deleteProjects removes multiple projects", async () => {
      const p1 = makeProjectData("A");
      await db.newSession([makeAction()], makeMakeCodeData("A"), p1);

      const p2 = makeProjectData("B");
      await db.newSession([makeAction()], makeMakeCodeData("B"), p2);

      const p3 = makeProjectData("C");
      await db.newSession([makeAction()], makeMakeCodeData("C"), p3);

      await db.deleteProjects([p1.id, p3.id]);

      const all = await db.getAllProjectData();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(p2.id);
    });
  });

  describe("updateSettings", () => {
    it("updates settings with a project id", async () => {
      const projectData = makeProjectData();
      await db.newSession([makeAction()], makeMakeCodeData(), projectData);

      const newSettings: Settings = { ...testSettings, languageId: "de" };
      await db.updateSettings(projectData.id, newSettings, Date.now());

      const loaded = await db.getProject(projectData.id);
      expect(loaded.settings.languageId).toBe("de");
    });

    it("updates settings without a project id", async () => {
      // Create a project so we can later verify settings via getProject.
      const projectData = makeProjectData();
      await db.newSession([makeAction()], makeMakeCodeData(), projectData);

      const newSettings: Settings = { ...testSettings, showGraphs: false };
      await db.updateSettings(undefined, newSettings, Date.now());

      const loaded = await db.getProject(projectData.id);
      expect(loaded.settings.showGraphs).toBe(false);
    });
  });

  describe("updateMakeCodeProject", () => {
    it("updates MakeCode data and project name", async () => {
      const projectData = makeProjectData("Old Name");
      await db.newSession(
        [makeAction()],
        makeMakeCodeData("Old Name"),
        projectData
      );

      const newMakeCode = makeMakeCodeData("New Name");
      newMakeCode.projectEdited = true;
      await db.updateMakeCodeProject(projectData.id, newMakeCode, Date.now());

      const loaded = await db.getProject(projectData.id);
      expect(loaded.project.header?.name).toBe("New Name");
      expect(loaded.projectEdited).toBe(true);
    });
  });

  describe("updateProjectTimestamp", () => {
    it("updates the timestamp", async () => {
      const projectData = makeProjectData();
      projectData.timestamp = 1000;
      await db.newSession([makeAction()], makeMakeCodeData(), projectData);

      const newTimestamp = 9999;
      await db.updateProjectTimestamp(projectData.id, newTimestamp);

      const all = await db.getAllProjectData();
      const project = all.find((p) => p.id === projectData.id);
      expect(project?.timestamp).toBe(newTimestamp);
    });
  });
});

describe.each(backends)("$name models", ({ name, factory }) => {
  let db: Database;

  beforeAll(async () => {
    await tf.setBackend("cpu");
    await tf.ready();
  });

  beforeEach(() => {
    db = factory();
  });

  afterEach(async () => {
    if (name === "IdbDatabase") {
      await cleanupIdb(db);
    }
  });

  const createSimpleModel = (): tf.LayersModel => {
    const input = tf.input({ shape: [3] });
    const dense = tf.layers.dense({ units: 2 }).apply(input);
    return tf.model({ inputs: input, outputs: dense as tf.SymbolicTensor });
  };

  it("save and load round-trip", async () => {
    const projectData = makeProjectData();
    await db.newSession([makeAction()], makeMakeCodeData(), projectData);

    const model = createSimpleModel();
    await db.saveModel(projectData.id, model);

    const loaded = await db.loadModel(projectData.id);
    expect(loaded).toBeDefined();
    expect(loaded!.inputs[0].shape).toEqual([null, 3]);
    expect(loaded!.outputs[0].shape).toEqual([null, 2]);

    model.dispose();
    loaded!.dispose();
  });

  it("load non-existent returns undefined", async () => {
    const projectData = makeProjectData();
    await db.newSession([makeAction()], makeMakeCodeData(), projectData);

    const loaded = await db.loadModel(projectData.id);
    expect(loaded).toBeUndefined();
  });

  it("removeModel removes the model", async () => {
    const projectData = makeProjectData();
    await db.newSession([makeAction()], makeMakeCodeData(), projectData);

    const model = createSimpleModel();
    await db.saveModel(projectData.id, model);
    await db.removeModel(projectData.id);

    const loaded = await db.loadModel(projectData.id);
    expect(loaded).toBeUndefined();

    model.dispose();
  });

  it("duplicateProject copies model", async () => {
    const projectData = makeProjectData();
    await db.newSession([makeAction()], makeMakeCodeData(), projectData);

    const model = createSimpleModel();
    await db.saveModel(projectData.id, model);

    const newId = uuid();
    await db.duplicateProject(projectData.id, {
      id: newId,
      name: "Clone",
      timestamp: Date.now(),
    });

    const cloneModel = await db.loadModel(newId);
    expect(cloneModel).toBeDefined();
    expect(cloneModel!.inputs[0].shape).toEqual([null, 3]);

    model.dispose();
    cloneModel!.dispose();
  });
});

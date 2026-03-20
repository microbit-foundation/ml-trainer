/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  SQLiteVanilla,
  SQLiteConnection,
} from "@microbit/capacitor-sqlite-vanilla";
import * as tf from "@tensorflow/tfjs";
import { v4 as uuid } from "uuid";
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import { ActionData, RecordingData } from "./model";
import { MakeCodeIcon } from "./utils/icons";
import {
  untitledProjectName,
  renameProject as renameMakeCodeProject,
} from "./project-utils";
import { defaultSettings, Settings } from "./settings";
import {
  Database,
  MakeCodeData,
  PersistedProjectData,
  ProjectData,
  ProjectDataWithActions,
  StoreAction,
  StorageError,
} from "./storage";

const DATABASE_NAME = "ml";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  required_confidence REAL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_actions_project_id ON actions(project_id);
CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recordings_action_id ON recordings(action_id);
CREATE TABLE IF NOT EXISTS editor_project (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  project_edited INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS models (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  metadata TEXT NOT NULL,
  weight_data TEXT
);
`;

/**
 * Subset of SQLiteDBConnection used by SqliteDatabase, allowing test
 * implementations (e.g. better-sqlite3) to be injected without pulling
 * in the full Capacitor plugin.
 */
export interface SqliteConnection {
  execute(statements: string, transaction?: boolean): Promise<unknown>;
  run(statement: string, values?: unknown[]): Promise<unknown>;
  query(
    statement: string,
    values?: unknown[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ values?: Record<string, any>[] }>;
  executeTransaction(
    txn: { statement: string; values?: unknown[] }[]
  ): Promise<unknown>;
}

// Row types for typed query results.
interface ProjectRow {
  id: string;
  name: string;
  timestamp: number;
}

interface ActionRow {
  id: string;
  project_id: string;
  name: string;
  icon: MakeCodeIcon;
  required_confidence: number | null;
  created_at: number;
}

interface RecordingRow {
  id: string;
  data: string;
  created_at: number;
}

interface EditorProjectRow {
  project_id: string;
  project: string;
  project_edited: number;
}

interface SettingsRow {
  value: string;
}

interface ModelRow {
  metadata: string;
  weight_data: string | null;
}

class Mutex {
  private queue: Promise<void> = Promise.resolve();

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const next = new Promise<void>((r) => {
      release = r;
    });
    const prev = this.queue;
    this.queue = next;
    await prev;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export class SqliteDatabase implements Database {
  private dbReady: Promise<SqliteConnection>;
  // Serialise all database operations. The Capacitor SQLite plugin supports
  // only one active transaction at a time on a single connection, so
  // concurrent calls (e.g. a store subscription firing while another write
  // is in progress) must be queued.
  private mutex = new Mutex();

  constructor(connectionFactory?: () => Promise<SqliteConnection>) {
    this.dbReady = connectionFactory
      ? connectionFactory().then((db) => this.initializeSchema(db))
      : this.initializeCapacitorDb();
  }

  private async initializeSchema(
    db: SqliteConnection
  ): Promise<SqliteConnection> {
    await db.execute("PRAGMA foreign_keys = ON;");
    await db.execute(SCHEMA);
    // Ensure default settings exist.
    const existing = await db.query("SELECT key FROM settings WHERE key = ?", [
      "settings",
    ]);
    if (!existing.values?.length) {
      await db.run("INSERT INTO settings (key, value) VALUES (?, ?)", [
        "settings",
        JSON.stringify(defaultSettings),
      ]);
    }
    return db;
  }

  private async initializeCapacitorDb(): Promise<SqliteConnection> {
    const sqlite = new SQLiteConnection(SQLiteVanilla);
    const db = await sqlite.createConnection(DATABASE_NAME);
    return this.initializeSchema(db);
  }

  /**
   * Run a database operation, serialised so that only one operation
   * is in progress at a time.
   */
  private serialise<T>(fn: (db: SqliteConnection) => Promise<T>): Promise<T> {
    return this.mutex.run(async () => fn(await this.dbReady));
  }

  private assertProjectId(id: string | undefined): string {
    if (!id) {
      throw new StorageError("Project id is undefined");
    }
    return id;
  }

  async newSession(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; name: string; id: string }
  ): Promise<void> {
    return this.serialise(async (db) => {
      const { id, name, timestamp } = projectData;
      const txn = [
        {
          statement:
            "INSERT INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
          values: [id, name, timestamp],
        },
        {
          statement:
            "INSERT INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        ...actions.map((a) => ({
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            a.id,
            id,
            a.name,
            a.icon,
            a.requiredConfidence ?? null,
            a.createdAt,
          ],
        })),
        ...actions.flatMap((a) =>
          a.recordings.map((r) => ({
            statement:
              "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [r.id, a.id, JSON.stringify(r.data), r.createdAt],
          }))
        ),
      ];
      await db.executeTransaction(txn);
    });
  }

  async getProject(id: string): Promise<PersistedProjectData> {
    return this.serialise(async (db) => {
      // Update timestamp to mark as most recently accessed.
      await db.run("UPDATE projects SET timestamp = ? WHERE id = ?", [
        Date.now(),
        id,
      ]);
      return this.loadProject(db, id);
    });
  }

  private async loadProject(
    db: SqliteConnection,
    id: string
  ): Promise<PersistedProjectData> {
    const projectResult = await db.query(
      "SELECT id, name, timestamp FROM projects WHERE id = ?",
      [id]
    );
    const projectRow = projectResult.values?.[0] as ProjectRow | undefined;
    if (!projectRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
    const actionsResult = await db.query(
      "SELECT id, project_id, name, icon, required_confidence, created_at FROM actions WHERE project_id = ? ORDER BY created_at ASC",
      [id]
    );
    const actions: ActionData[] = await Promise.all(
      ((actionsResult.values as ActionRow[] | undefined) ?? []).map(
        async (row: ActionRow) => {
          const recordingsResult = await db.query(
            "SELECT id, data, created_at FROM recordings WHERE action_id = ?",
            [row.id]
          );
          const recordings: RecordingData[] = (
            (recordingsResult.values as RecordingRow[] | undefined) ?? []
          ).map((r: RecordingRow) => ({
            id: r.id,
            data: JSON.parse(r.data) as RecordingData["data"],
            createdAt: r.created_at,
          }));
          return {
            id: row.id,
            name: row.name,
            icon: row.icon,
            requiredConfidence:
              row.required_confidence != null
                ? row.required_confidence
                : undefined,
            createdAt: row.created_at,
            recordings,
          };
        }
      )
    );

    const makeCodeRow = await getMakeCodeProject(db, id);
    if (!makeCodeRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }

    return {
      ...makeCodeRow,
      id,
      actions,
      timestamp: projectRow.timestamp,
    };
  }

  async getAllProjectData(): Promise<ProjectDataWithActions[]> {
    return this.serialise(async (db) => {
      const projectsResult = await db.query(
        "SELECT id, name, timestamp FROM projects ORDER BY timestamp DESC"
      );
      const projects = (projectsResult.values ?? []) as ProjectRow[];
      return Promise.all(
        projects.map(async (p: ProjectRow) => {
          const actionsResult = await db.query(
            "SELECT id, project_id, name, icon, required_confidence, created_at FROM actions WHERE project_id = ?",
            [p.id]
          );
          const actions: StoreAction[] = (
            (actionsResult.values ?? []) as ActionRow[]
          ).map((row: ActionRow) => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            requiredConfidence:
              row.required_confidence != null
                ? row.required_confidence
                : undefined,
            createdAt: row.created_at,
            projectId: row.project_id,
          }));
          return {
            id: p.id,
            name: p.name,
            timestamp: p.timestamp,
            actions,
          };
        })
      );
    });
  }

  async importProject(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string }
  ): Promise<void> {
    return this.serialise(async (db) => {
      const { id, timestamp } = projectData;
      const name = makeCodeData.project.header?.name ?? untitledProjectName;
      const txn = [
        {
          statement:
            "INSERT INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
          values: [id, name, timestamp],
        },
        {
          statement:
            "INSERT INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        ...actions.map((a) => ({
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            a.id,
            id,
            a.name,
            a.icon,
            a.requiredConfidence ?? null,
            a.createdAt,
          ],
        })),
        ...actions.flatMap((a) =>
          a.recordings.map((r) => ({
            statement:
              "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [r.id, a.id, JSON.stringify(r.data), r.createdAt],
          }))
        ),
      ];
      await db.executeTransaction(txn);
    });
  }

  async addAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            action.id,
            id,
            action.name,
            action.icon,
            action.requiredConfidence ?? null,
            action.createdAt,
          ],
        },
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async updateAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement:
            "UPDATE actions SET name = ?, icon = ?, required_confidence = ? WHERE id = ?",
          values: [
            action.name,
            action.icon,
            action.requiredConfidence ?? null,
            action.id,
          ],
        },
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async updateActions(
    id: string | undefined,
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        ...actions.map((a) => ({
          statement:
            "UPDATE actions SET name = ?, icon = ?, required_confidence = ? WHERE id = ?",
          values: [a.name, a.icon, a.requiredConfidence ?? null, a.id],
        })),
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async deleteAction(
    id: string | undefined,
    action: ActionData,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement: "DELETE FROM actions WHERE id = ?",
          values: [action.id],
        },
        ...newActions.map((a) => ({
          statement:
            "INSERT OR REPLACE INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            a.id,
            id,
            a.name,
            a.icon,
            a.requiredConfidence ?? null,
            a.createdAt,
          ],
        })),
        ...newActions.flatMap((a) =>
          a.recordings.map((r) => ({
            statement:
              "INSERT OR REPLACE INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [r.id, a.id, JSON.stringify(r.data), r.createdAt],
          }))
        ),
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async deleteAllActions(
    id: string | undefined,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement: "DELETE FROM actions WHERE project_id = ?",
          values: [id],
        },
        ...newActions.map((a) => ({
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            a.id,
            id,
            a.name,
            a.icon,
            a.requiredConfidence ?? null,
            a.createdAt,
          ],
        })),
        ...newActions.flatMap((a) =>
          a.recordings.map((r) => ({
            statement:
              "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [r.id, a.id, JSON.stringify(r.data), r.createdAt],
          }))
        ),
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async replaceActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string | undefined }
  ): Promise<void> {
    const id = this.assertProjectId(projectData.id);
    return this.serialise(async (db) => {
      const name = makeCodeData.project.header?.name ?? untitledProjectName;
      await db.executeTransaction([
        {
          statement: "DELETE FROM actions WHERE project_id = ?",
          values: [id],
        },
        ...actions.map((a) => ({
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            a.id,
            id,
            a.name,
            a.icon,
            a.requiredConfidence ?? null,
            a.createdAt,
          ],
        })),
        ...actions.flatMap((a) =>
          a.recordings.map((r) => ({
            statement:
              "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [r.id, a.id, JSON.stringify(r.data), r.createdAt],
          }))
        ),
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET name = ?, timestamp = ? WHERE id = ?",
          values: [name, projectData.timestamp, id],
        },
      ]);
    });
  }

  async addRecording(
    id: string | undefined,
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement:
            "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
          values: [
            recording.id,
            action.id,
            JSON.stringify(recording.data),
            recording.createdAt,
          ],
        },
        {
          statement:
            "UPDATE actions SET name = ?, icon = ?, required_confidence = ? WHERE id = ?",
          values: [
            action.name,
            action.icon,
            action.requiredConfidence ?? null,
            action.id,
          ],
        },
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async deleteRecording(
    id: string | undefined,
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.executeTransaction([
        {
          statement: "DELETE FROM recordings WHERE id = ?",
          values: [key],
        },
        {
          statement:
            "UPDATE actions SET name = ?, icon = ?, required_confidence = ? WHERE id = ?",
          values: [
            action.name,
            action.icon,
            action.requiredConfidence ?? null,
            action.id,
          ],
        },
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
          values: [timestamp, id],
        },
      ]);
    });
  }

  async updateMakeCodeProject(
    id: string | undefined,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      const name = makeCodeData.project.header?.name;
      await db.executeTransaction([
        {
          statement:
            "INSERT OR REPLACE INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [
            id,
            JSON.stringify(makeCodeData.project),
            makeCodeData.projectEdited ? 1 : 0,
          ],
        },
        {
          statement: "UPDATE projects SET timestamp = ?, name = ? WHERE id = ?",
          values: [timestamp, name ?? untitledProjectName, id],
        },
      ]);
    });
  }

  async updateProjectTimestamp(
    id: string | undefined,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.run("UPDATE projects SET timestamp = ? WHERE id = ?", [
        timestamp,
        id,
      ]);
    });
  }

  async renameProject(
    id: string,
    name: string,
    timestamp: number
  ): Promise<void> {
    return this.serialise(async (db) => {
      // Update project name and the MakeCode project header.
      const makeCodeRow = await getMakeCodeProject(db, id);
      if (makeCodeRow) {
        const project = renameMakeCodeProject(makeCodeRow.project, name);
        await db.executeTransaction([
          {
            statement:
              "UPDATE editor_project SET project = ? WHERE project_id = ?",
            values: [JSON.stringify(project), id],
          },
          {
            statement:
              "UPDATE projects SET name = ?, timestamp = ? WHERE id = ?",
            values: [name, timestamp, id],
          },
        ]);
      } else {
        await db.run(
          "UPDATE projects SET name = ?, timestamp = ? WHERE id = ?",
          [name, timestamp, id]
        );
      }
    });
  }

  async duplicateProject(
    existingProjectId: string,
    newProjectData: ProjectData
  ): Promise<void> {
    return this.serialise(async (db) => {
      const { id, name, timestamp } = newProjectData;
      // Load source data.
      const actionsResult = await db.query(
        "SELECT id, project_id, name, icon, required_confidence, created_at FROM actions WHERE project_id = ?",
        [existingProjectId]
      );
      const makeCodeRow = await getMakeCodeProject(db, existingProjectId);
      const projectResult = await db.query(
        "SELECT id, name, timestamp FROM projects WHERE id = ?",
        [existingProjectId]
      );
      const projectRow = projectResult.values?.[0] as ProjectRow | undefined;
      if (!makeCodeRow || !projectRow) {
        throw new StorageError("Failed to fetch expected data from storage");
      }
      // Update MakeCode project header name.
      const project = renameMakeCodeProject(makeCodeRow.project, name);
      const txn: { statement: string; values: unknown[] }[] = [
        {
          statement:
            "INSERT INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
          values: [id, name, timestamp],
        },
        {
          statement:
            "INSERT INTO editor_project (project_id, project, project_edited) VALUES (?, ?, ?)",
          values: [id, JSON.stringify(project), makeCodeRow.projectEdited],
        },
      ];
      for (const action of (actionsResult.values ?? []) as ActionRow[]) {
        const newActionId = uuid();
        txn.push({
          statement:
            "INSERT INTO actions (id, project_id, name, icon, required_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            newActionId,
            id,
            action.name,
            action.icon,
            action.required_confidence,
            action.created_at,
          ],
        });
        const recordingsResult = await db.query(
          "SELECT id, data, created_at FROM recordings WHERE action_id = ?",
          [action.id]
        );
        for (const recording of (recordingsResult.values ??
          []) as RecordingRow[]) {
          const newRecordingId = uuid();
          txn.push({
            statement:
              "INSERT INTO recordings (id, action_id, data, created_at) VALUES (?, ?, ?, ?)",
            values: [
              newRecordingId,
              newActionId,
              recording.data,
              recording.created_at,
            ],
          });
        }
      }
      // Copy model if it exists.
      const modelResult = await db.query(
        "SELECT metadata, weight_data FROM models WHERE project_id = ?",
        [existingProjectId]
      );
      if (modelResult.values?.length) {
        const modelRow = modelResult.values[0] as ModelRow;
        txn.push({
          statement:
            "INSERT INTO models (project_id, metadata, weight_data) VALUES (?, ?, ?)",
          values: [id, modelRow.metadata, modelRow.weight_data],
        });
      }
      await db.executeTransaction(txn);
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.serialise(async (db) => {
      await db.run("DELETE FROM projects WHERE id = ?", [id]);
    });
  }

  async deleteProjects(ids: string[]): Promise<void> {
    return this.serialise(async (db) => {
      await db.executeTransaction(
        ids.map((id) => ({
          statement: "DELETE FROM projects WHERE id = ?",
          values: [id],
        }))
      );
    });
  }

  async getSettings(): Promise<Settings> {
    return this.serialise(async (db) => {
      const result = await db.query(
        "SELECT value FROM settings WHERE key = ?",
        ["settings"]
      );
      const row = result.values?.[0] as SettingsRow | undefined;
      if (!row) {
        throw new StorageError("Failed to fetch expected data from storage");
      }
      return JSON.parse(row.value) as Settings;
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    return this.serialise(async (db) => {
      await db.run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        ["settings", JSON.stringify(settings)]
      );
    });
  }

  async saveModel(
    id: string | undefined,
    model: tf.LayersModel
  ): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await model.save(
        tf.io.withSaveHandler(async (artifacts) => {
          // Normalize weight data to single ArrayBuffer for consistent serialization.
          const weightData = artifacts.weightData
            ? tf.io.concatenateArrayBuffers(
                Array.isArray(artifacts.weightData)
                  ? artifacts.weightData
                  : [artifacts.weightData]
              )
            : undefined;
          const metadata = JSON.stringify({
            modelTopology: artifacts.modelTopology,
            weightSpecs: artifacts.weightSpecs,
            format: artifacts.format,
            generatedBy: artifacts.generatedBy,
            convertedBy: artifacts.convertedBy,
            signature: artifacts.signature,
            userDefinedMetadata: artifacts.userDefinedMetadata,
            trainingConfig: artifacts.trainingConfig,
          });
          await db.run(
            "INSERT OR REPLACE INTO models (project_id, metadata, weight_data) VALUES (?, ?, ?)",
            [id, metadata, weightData ? arrayBufferToBase64(weightData) : null]
          );
          return {
            modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
          };
        })
      );
    });
  }

  async removeModel(id: string | undefined): Promise<void> {
    id = this.assertProjectId(id);
    return this.serialise(async (db) => {
      await db.run("DELETE FROM models WHERE project_id = ?", [id]);
    });
  }

  async loadModel(id: string): Promise<tf.LayersModel | undefined> {
    return this.serialise(async (db) => {
      const result = await db.query(
        "SELECT metadata, weight_data FROM models WHERE project_id = ?",
        [id]
      );
      if (!result.values?.length) {
        return undefined;
      }
      const row = result.values[0] as ModelRow;
      const metadata = JSON.parse(row.metadata) as Omit<
        tf.io.ModelArtifacts,
        "weightData"
      >;
      const artifacts: tf.io.ModelArtifacts = {
        ...metadata,
        weightData: row.weight_data
          ? base64ToArrayBuffer(row.weight_data)
          : undefined,
      };
      return tf.loadLayersModel(tf.io.fromMemory(artifacts));
    });
  }
}

interface MakeCodeRow {
  project: MakeCodeProject;
  projectEdited: boolean;
}

async function getMakeCodeProject(
  db: SqliteConnection,
  id: string
): Promise<MakeCodeRow | undefined> {
  const makeCodeResult = await db.query(
    "SELECT project_id, project, project_edited FROM editor_project WHERE project_id = ?",
    [id]
  );

  const makeCodeRow = makeCodeResult.values?.[0] as
    | EditorProjectRow
    | undefined;
  if (!makeCodeRow || !makeCodeRow.project) {
    return undefined;
  }
  return {
    project: JSON.parse(makeCodeRow.project) as MakeCodeProject,
    projectEdited: !!makeCodeRow.project_edited,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

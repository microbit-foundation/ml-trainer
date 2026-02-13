/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import * as tf from "@tensorflow/tfjs";
import { v4 as uuid } from "uuid";
import { ActionData, RecordingData } from "./model";
import { untitledProjectName } from "./project-utils";
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
const DATABASE_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  required_confidence REAL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_actions_project_id ON actions(project_id);
CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES actions(id),
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recordings_action_id ON recordings(action_id);
CREATE TABLE IF NOT EXISTS makecode_data (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  project TEXT NOT NULL,
  project_edited INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS models (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  metadata TEXT NOT NULL,
  weight_data TEXT
);
`;

export class SqliteDatabase implements Database {
  private dbReady: Promise<SQLiteDBConnection>;

  constructor() {
    this.dbReady = this.initializeDb();
  }

  // To add a schema migration, bump DATABASE_VERSION and register upgrade
  // statements via sqlite.addUpgradeStatement() before createConnection().
  // Keep SCHEMA as the full current schema for fresh installs.
  private async initializeDb(): Promise<SQLiteDBConnection> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection(
      DATABASE_NAME,
      false,
      "no-encryption",
      DATABASE_VERSION,
      false
    );
    await db.open();
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

  private async useDb(): Promise<SQLiteDBConnection> {
    return this.dbReady;
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
    const db = await this.useDb();
    const { id, name, timestamp } = projectData;
    const txn = [
      {
        statement:
          "INSERT INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
        values: [id, name, timestamp],
      },
      {
        statement:
          "INSERT INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async getProject(id: string): Promise<PersistedProjectData> {
    const db = await this.useDb();
    // Update timestamp to mark as most recently accessed.
    await db.run("UPDATE projects SET timestamp = ? WHERE id = ?", [
      Date.now(),
      id,
    ]);
    return this.loadProject(db, id);
  }

  async getLatestProject(): Promise<PersistedProjectData | undefined> {
    const db = await this.useDb();
    const result = await db.query(
      "SELECT id FROM projects ORDER BY timestamp DESC LIMIT 1"
    );
    if (!result.values?.length) {
      return undefined;
    }
    return this.loadProject(db, result.values[0].id);
  }

  private async loadProject(
    db: SQLiteDBConnection,
    id: string
  ): Promise<PersistedProjectData> {
    const projectResult = await db.query(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );
    const projectRow = projectResult.values?.[0];
    if (!projectRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
    const actionsResult = await db.query(
      "SELECT * FROM actions WHERE project_id = ? ORDER BY created_at ASC",
      [id]
    );
    const actions: ActionData[] = await Promise.all(
      (actionsResult.values ?? []).map(async (row) => {
        const recordingsResult = await db.query(
          "SELECT * FROM recordings WHERE action_id = ?",
          [row.id]
        );
        const recordings: RecordingData[] = (recordingsResult.values ?? []).map(
          (r) => ({
            id: r.id,
            data: JSON.parse(r.data),
            createdAt: r.created_at,
          })
        );
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
      })
    );
    const makeCodeResult = await db.query(
      "SELECT * FROM makecode_data WHERE project_id = ?",
      [id]
    );
    const makeCodeRow = makeCodeResult.values?.[0];
    if (!makeCodeRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
    const settingsResult = await db.query(
      "SELECT value FROM settings WHERE key = ?",
      ["settings"]
    );
    const settingsRow = settingsResult.values?.[0];
    if (!settingsRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
    return {
      id,
      actions,
      project: JSON.parse(makeCodeRow.project),
      projectEdited: !!makeCodeRow.project_edited,
      timestamp: projectRow.timestamp,
      settings: JSON.parse(settingsRow.value),
    };
  }

  async getAllProjectData(): Promise<ProjectDataWithActions[]> {
    const db = await this.useDb();
    const projectsResult = await db.query(
      "SELECT * FROM projects ORDER BY timestamp DESC"
    );
    const projects = projectsResult.values ?? [];
    return Promise.all(
      projects.map(async (p) => {
        const actionsResult = await db.query(
          "SELECT * FROM actions WHERE project_id = ?",
          [p.id]
        );
        const actions: StoreAction[] = (actionsResult.values ?? []).map(
          (row) => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            requiredConfidence:
              row.required_confidence != null
                ? row.required_confidence
                : undefined,
            createdAt: row.created_at,
            projectId: row.project_id,
          })
        );
        return {
          id: p.id,
          name: p.name,
          timestamp: p.timestamp,
          actions,
        };
      })
    );
  }

  async importProject(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string },
    settings: Settings
  ): Promise<void> {
    const db = await this.useDb();
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
          "INSERT INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
        values: [
          id,
          JSON.stringify(makeCodeData.project),
          makeCodeData.projectEdited ? 1 : 0,
        ],
      },
      {
        statement: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        values: ["settings", JSON.stringify(settings)],
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
  }

  async addAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async updateAction(
    id: string | undefined,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async updateActions(
    id: string | undefined,
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.executeTransaction([
      ...actions.map((a) => ({
        statement:
          "UPDATE actions SET name = ?, icon = ?, required_confidence = ? WHERE id = ?",
        values: [a.name, a.icon, a.requiredConfidence ?? null, a.id],
      })),
      {
        statement:
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async deleteAction(
    id: string | undefined,
    action: ActionData,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.executeTransaction([
      {
        statement: "DELETE FROM recordings WHERE action_id = ?",
        values: [action.id],
      },
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async deleteAllActions(
    id: string | undefined,
    newActions: ActionData[],
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.executeTransaction([
      {
        statement:
          "DELETE FROM recordings WHERE action_id IN (SELECT id FROM actions WHERE project_id = ?)",
        values: [id],
      },
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async replaceActions(
    actions: ActionData[],
    makeCodeData: MakeCodeData,
    projectData: { timestamp: number; id: string | undefined },
    settings: Settings
  ): Promise<void> {
    const id = this.assertProjectId(projectData.id);
    const db = await this.useDb();
    const name = makeCodeData.project.header?.name ?? untitledProjectName;
    await db.executeTransaction([
      {
        statement:
          "DELETE FROM recordings WHERE action_id IN (SELECT id FROM actions WHERE project_id = ?)",
        values: [id],
      },
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
        values: [
          id,
          JSON.stringify(makeCodeData.project),
          makeCodeData.projectEdited ? 1 : 0,
        ],
      },
      {
        statement:
          "INSERT OR REPLACE INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
        values: [id, name, projectData.timestamp],
      },
      {
        statement: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        values: ["settings", JSON.stringify(settings)],
      },
    ]);
  }

  async addRecording(
    id: string | undefined,
    recording: RecordingData,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async deleteRecording(
    id: string | undefined,
    key: string,
    action: ActionData,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
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
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async updateMakeCodeProject(
    id: string | undefined,
    makeCodeData: MakeCodeData,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    const name = makeCodeData.project.header?.name;
    await db.executeTransaction([
      {
        statement:
          "INSERT OR REPLACE INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
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
  }

  async updateProjectTimestamp(
    id: string | undefined,
    timestamp: number
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.run("UPDATE projects SET timestamp = ? WHERE id = ?", [
      timestamp,
      id,
    ]);
  }

  async renameProject(
    id: string,
    name: string,
    timestamp: number
  ): Promise<void> {
    const db = await this.useDb();
    // Update project name and the MakeCode project header.
    const makeCodeResult = await db.query(
      "SELECT * FROM makecode_data WHERE project_id = ?",
      [id]
    );
    const makeCodeRow = makeCodeResult.values?.[0];
    if (makeCodeRow) {
      const project = JSON.parse(makeCodeRow.project);
      if (project.header) {
        project.header.name = name;
      }
      await db.executeTransaction([
        {
          statement:
            "UPDATE makecode_data SET project = ? WHERE project_id = ?",
          values: [JSON.stringify(project), id],
        },
        {
          statement: "UPDATE projects SET name = ?, timestamp = ? WHERE id = ?",
          values: [name, timestamp, id],
        },
      ]);
    } else {
      await db.run("UPDATE projects SET name = ?, timestamp = ? WHERE id = ?", [
        name,
        timestamp,
        id,
      ]);
    }
  }

  async duplicateProject(
    existingProjectId: string,
    newProjectData: ProjectData
  ): Promise<void> {
    const db = await this.useDb();
    const { id, name, timestamp } = newProjectData;
    // Load source data.
    const actionsResult = await db.query(
      "SELECT * FROM actions WHERE project_id = ?",
      [existingProjectId]
    );
    const makeCodeResult = await db.query(
      "SELECT * FROM makecode_data WHERE project_id = ?",
      [existingProjectId]
    );
    const projectResult = await db.query(
      "SELECT * FROM projects WHERE id = ?",
      [existingProjectId]
    );
    const makeCodeRow = makeCodeResult.values?.[0];
    const projectRow = projectResult.values?.[0];
    if (!makeCodeRow || !projectRow) {
      throw new StorageError("Failed to fetch expected data from storage");
    }
    // Update MakeCode project header name.
    const project = JSON.parse(makeCodeRow.project);
    if (project.header) {
      project.header.name = name;
    }
    const txn: { statement: string; values: unknown[] }[] = [
      {
        statement:
          "INSERT INTO projects (id, name, timestamp) VALUES (?, ?, ?)",
        values: [id, name, timestamp],
      },
      {
        statement:
          "INSERT INTO makecode_data (project_id, project, project_edited) VALUES (?, ?, ?)",
        values: [id, JSON.stringify(project), makeCodeRow.project_edited],
      },
    ];
    for (const action of actionsResult.values ?? []) {
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
        "SELECT * FROM recordings WHERE action_id = ?",
        [action.id]
      );
      for (const recording of recordingsResult.values ?? []) {
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
      txn.push({
        statement:
          "INSERT INTO models (project_id, metadata, weight_data) VALUES (?, ?, ?)",
        values: [
          id,
          modelResult.values[0].metadata,
          modelResult.values[0].weight_data,
        ],
      });
    }
    await db.executeTransaction(txn);
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.useDb();
    await db.executeTransaction([
      {
        statement:
          "DELETE FROM recordings WHERE action_id IN (SELECT id FROM actions WHERE project_id = ?)",
        values: [id],
      },
      {
        statement: "DELETE FROM actions WHERE project_id = ?",
        values: [id],
      },
      {
        statement: "DELETE FROM makecode_data WHERE project_id = ?",
        values: [id],
      },
      {
        statement: "DELETE FROM models WHERE project_id = ?",
        values: [id],
      },
      {
        statement: "DELETE FROM projects WHERE id = ?",
        values: [id],
      },
    ]);
  }

  async deleteProjects(ids: string[]): Promise<void> {
    const db = await this.useDb();
    const txn: { statement: string; values: unknown[] }[] = [];
    for (const id of ids) {
      txn.push(
        {
          statement:
            "DELETE FROM recordings WHERE action_id IN (SELECT id FROM actions WHERE project_id = ?)",
          values: [id],
        },
        {
          statement: "DELETE FROM actions WHERE project_id = ?",
          values: [id],
        },
        {
          statement: "DELETE FROM makecode_data WHERE project_id = ?",
          values: [id],
        },
        {
          statement: "DELETE FROM models WHERE project_id = ?",
          values: [id],
        },
        {
          statement: "DELETE FROM projects WHERE id = ?",
          values: [id],
        }
      );
    }
    await db.executeTransaction(txn);
  }

  async updateSettings(
    id: string | undefined,
    settings: Settings,
    timestamp: number
  ): Promise<void> {
    const db = await this.useDb();
    const txn: { statement: string; values: unknown[] }[] = [
      {
        statement: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        values: ["settings", JSON.stringify(settings)],
      },
    ];
    if (id) {
      txn.push({
        statement: "UPDATE projects SET timestamp = ? WHERE id = ?",
        values: [timestamp, id],
      });
    }
    await db.executeTransaction(txn);
  }

  async saveModel(
    id: string | undefined,
    model: tf.LayersModel
  ): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
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
  }

  async removeModel(id: string | undefined): Promise<void> {
    id = this.assertProjectId(id);
    const db = await this.useDb();
    await db.run("DELETE FROM models WHERE project_id = ?", [id]);
  }

  async loadModel(id: string): Promise<tf.LayersModel | undefined> {
    const db = await this.useDb();
    const result = await db.query(
      "SELECT metadata, weight_data FROM models WHERE project_id = ?",
      [id]
    );
    if (!result.values?.length) {
      return undefined;
    }
    const row = result.values[0];
    const metadata = JSON.parse(row.metadata);
    const artifacts: tf.io.ModelArtifacts = {
      ...metadata,
      weightData: row.weight_data
        ? base64ToArrayBuffer(row.weight_data)
        : undefined,
    };
    return tf.loadLayersModel(tf.io.fromMemory(artifacts));
  }
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

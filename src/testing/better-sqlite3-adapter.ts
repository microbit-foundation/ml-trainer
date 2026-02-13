/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import Database from "better-sqlite3";
import { SqliteConnection } from "../sqlite-storage";

// Future: once node:sqlite is stable this adapter can be replaced with a
// zero-dependency alternative built on the Node built-in module.

/**
 * Wraps an in-memory better-sqlite3 database behind SqliteConnection so
 * SqliteDatabase can be tested without the Capacitor plugin.
 */
export const createBetterSqlite3Connection =
  (): (() => Promise<SqliteConnection>) =>
  async (): Promise<SqliteConnection> => {
    const db = new Database(":memory:");
    return {
      async execute(statements: string) {
        db.exec(statements);
      },
      async run(statement: string, values?: unknown[]) {
        db.prepare(statement).run(...(values ?? []));
      },
      async query(statement: string, values?: unknown[]) {
        const rows = db.prepare(statement).all(...(values ?? []));
        return { values: rows as Record<string, unknown>[] };
      },
      async executeTransaction(
        txn: { statement: string; values?: unknown[] }[]
      ) {
        const runTxn = db.transaction(() => {
          for (const { statement, values } of txn) {
            db.prepare(statement).run(...(values ?? []));
          }
        });
        runTxn();
      },
    };
  };

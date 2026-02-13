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
  (): (() => Promise<SqliteConnection>) => (): Promise<SqliteConnection> => {
    const db = new Database(":memory:");
    return Promise.resolve({
      execute(statements: string) {
        db.exec(statements);
        return Promise.resolve(undefined);
      },
      run(statement: string, values?: unknown[]) {
        db.prepare(statement).run(...(values ?? []));
        return Promise.resolve(undefined);
      },
      query(statement: string, values?: unknown[]) {
        const rows = db.prepare(statement).all(...(values ?? []));
        return Promise.resolve({
          values: rows as Record<string, unknown>[],
        });
      },
      executeTransaction(txn: { statement: string; values?: unknown[] }[]) {
        const runTxn = db.transaction(() => {
          for (const { statement, values } of txn) {
            db.prepare(statement).run(...(values ?? []));
          }
        });
        runTxn();
        return Promise.resolve(undefined);
      },
    });
  };

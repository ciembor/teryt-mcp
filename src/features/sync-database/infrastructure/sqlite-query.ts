import { readFile } from "node:fs/promises";
import { join } from "node:path";

import initSqlJs from "sql.js";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";

let sqlJs: Promise<SqlJsStatic> | undefined;

export async function withTerytDatabase<T>(dataDir: string, callback: (db: Database) => T): Promise<T> {
  let content: Uint8Array;

  try {
    content = await readFile(join(dataDir, "teryt.sqlite"));
  } catch (error) {
    if (isMissingFile(error)) {
      const db = await createEmptyDatabase();

      try {
        return callback(db);
      } finally {
        db.close();
      }
    }

    throw error;
  }

  const SQL = await loadSqlJs();
  const db = new SQL.Database(content);

  try {
    return callback(db);
  } finally {
    db.close();
  }
}

export function queryOne<T>(db: Database, sql: string, params: readonly SqlValue[], map: (row: SqlRow) => T): T | null {
  return queryMany(db, sql, params, map)[0] ?? null;
}

export function queryMany<T>(db: Database, sql: string, params: readonly SqlValue[], map: (row: SqlRow) => T): readonly T[] {
  const statement = db.prepare(sql);
  const rows: T[] = [];

  try {
    statement.bind([...params]);

    while (statement.step()) {
      rows.push(map(statement.getAsObject() as SqlRow));
    }
  } finally {
    statement.free();
  }

  return rows;
}

async function createEmptyDatabase(): Promise<Database> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE places (id TEXT, name TEXT, stateDate TEXT, unitId TEXT)");
  db.run("CREATE TABLE streets (SYM_UL TEXT, id TEXT, name TEXT, placeId TEXT, stateDate TEXT)");
  db.run("CREATE TABLE units (id TEXT, name TEXT, stateDate TEXT, type TEXT)");
  return db;
}

function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= initSqlJs();
  return sqlJs;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export type SqlRow = Record<string, unknown>;

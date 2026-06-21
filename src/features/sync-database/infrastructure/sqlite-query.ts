import { readFile } from "node:fs/promises";
import { join } from "node:path";

import initSqlJs from "sql.js";
import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { terytDatabaseSchemaVersion } from "../domain/database-schema.js";

let sqlJs: Promise<SqlJsStatic> | undefined;
const databaseFileName = "teryt.sqlite";

export async function withTerytDatabase<T>(dataDir: string, callback: (db: Database) => T): Promise<T> {
  let content: Uint8Array;

  try {
    content = await readFile(join(dataDir, databaseFileName));
  } catch (error) {
    if (isMissingFile(error)) {
      throw new Error(`TERYT database is missing at ${join(dataDir, databaseFileName)}. Run sync_database first.`);
    }

    throw error;
  }

  const SQL = await loadSqlJs();
  const db = new SQL.Database(content);

  try {
    assertCompatibleSchema(db);
    return callback(db);
  } finally {
    db.close();
  }
}

export async function readTerytDatabaseSchemaVersion(dataDir: string): Promise<number | null> {
  let content: Uint8Array;

  try {
    content = await readFile(join(dataDir, databaseFileName));
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }

    throw error;
  }

  const SQL = await loadSqlJs();
  let db: Database;

  try {
    db = new SQL.Database(content);
  } catch {
    return null;
  }

  try {
    return readSchemaVersion(db);
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

function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= initSqlJs();
  return sqlJs;
}

function assertCompatibleSchema(db: Database): void {
  const actual = readSchemaVersion(db);

  if (actual !== terytDatabaseSchemaVersion) {
    throw new Error(
      `TERYT database schema is incompatible (found ${actual ?? "unknown"}, expected ${terytDatabaseSchemaVersion}). Run teryt-mcp sync --force.`,
    );
  }
}

function readSchemaVersion(db: Database): number | null {
  try {
    const row = queryOne(db, "SELECT value FROM metadata WHERE key = ?", ["schemaVersion"], (value) => value);
    const version = Number(row?.value);
    return Number.isInteger(version) ? version : null;
  } catch {
    return null;
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export type SqlRow = Record<string, unknown>;

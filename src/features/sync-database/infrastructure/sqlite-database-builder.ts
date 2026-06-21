import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";

import { importTerytCsv } from "../application/importers/teryt-csv.js";
import { importTerytSourceFile } from "../application/importers/teryt-source-file.js";
import { validateTerytRelations } from "../application/importers/teryt-relations.js";
import { terytSqliteSchema } from "../application/importers/sqlite-schema.js";
import type { DatabaseBuilder, BuiltDatabase } from "../application/ports/database-builder.js";
import type { SourceFile } from "../application/ports/teryt-source.js";
import { terytDatabaseSchemaVersion } from "../domain/database-schema.js";
import { insertSearchTables } from "./sqlite-search-tables.js";

type ImportedDataset = ReturnType<typeof importTerytCsv>;
type ImportedRow = ImportedDataset["rows"][number];

export class SqliteDatabaseBuilder implements DatabaseBuilder {
  async build(sourceFiles: readonly SourceFile[]): Promise<BuiltDatabase> {
    const SQL = await loadSqlJs();
    const db = new SQL.Database();

    try {
      const imports = sourceFiles.map((sourceFile) => importTerytSourceFile(sourceFile));

      validateTerytRelations(imports);
      createSchema(db);
      db.run("BEGIN");
      insertRawDatasets(db, imports);
      insertSearchTables(db, imports);
      insertMetadata(db, imports);
      db.run("COMMIT");

      return {
        content: db.export(),
      };
    } catch (error) {
      rollback(db);
      throw error;
    } finally {
      db.close();
    }
  }
}

let sqlJs: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= initSqlJs();

  return sqlJs;
}

function createSchema(db: Database): void {
  for (const statement of terytSqliteSchema) {
    runSchemaStatement(db, statement);
  }
}

function runSchemaStatement(db: Database, statement: string): void {
  try {
    db.run(statement);
  } catch (error) {
    const fallback = createFtsFallbackStatement(statement, error);

    if (!fallback) {
      throw error;
    }

    db.run(fallback);
  }
}

function createFtsFallbackStatement(statement: string, error: unknown): string | null {
  if (!(error instanceof Error) || !error.message.includes("no such module: fts5")) {
    return null;
  }

  const prefix = "CREATE VIRTUAL TABLE ";

  if (!statement.startsWith(prefix)) {
    return null;
  }

  const tableNameEnd = statement.indexOf(" USING fts5(");

  if (tableNameEnd < prefix.length) {
    return null;
  }

  const firstColumnStart = tableNameEnd + " USING fts5(".length;
  const firstColumnEnd = statement.indexOf(",", firstColumnStart);
  const tableName = statement.slice(prefix.length, tableNameEnd);
  const firstColumn = statement.slice(firstColumnStart, firstColumnEnd < 0 ? undefined : firstColumnEnd).trim();

  return tableName && firstColumn ? `CREATE TABLE ${tableName} (${firstColumn} TEXT)` : null;
}

function insertRawDatasets(db: Database, imports: readonly ImportedDataset[]): void {
  for (const imported of imports) {
    insertRows(db, `raw_${imported.dataset.toLowerCase()}`, imported.columns, imported.rows);
  }
}

function insertMetadata(db: Database, imports: readonly ImportedDataset[]): void {
  const metadata = [
    ["datasetCount", String(imports.length)],
    ["schemaVersion", String(terytDatabaseSchemaVersion)],
    ["stateDates", imports.map((item) => `${item.dataset}:${item.stateDate}`).join(",")],
  ];

  for (const [key, value] of metadata) {
    db.run("INSERT INTO metadata (key, value) VALUES (?, ?)", [key, value]);
  }
}

function insertRows(db: Database, table: string, columns: readonly string[], rows: readonly ImportedRow[]): void {
  const columnList = columns.join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const statement = db.prepare(`INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`);

  try {
    for (const row of rows) {
      statement.run(columns.map((column) => row.values[column] ?? ""));
    }
  } finally {
    statement.free();
  }
}

function rollback(db: Database): void {
  try {
    db.run("ROLLBACK");
  } catch {
    // Ignore rollback failures when the transaction was never opened.
  }
}

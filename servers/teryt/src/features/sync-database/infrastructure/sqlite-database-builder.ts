import { TextDecoder } from "node:util";

import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";

import { importTerytCsv } from "../application/importers/teryt-csv.js";
import { validateTerytRelations } from "../application/importers/teryt-relations.js";
import { terytSqliteSchema } from "../application/importers/sqlite-schema.js";
import type { DatabaseBuilder, BuiltDatabase } from "../application/ports/database-builder.js";
import type { SourceFile } from "../application/ports/teryt-source.js";
import type { DatasetCode } from "../domain/dataset.js";

type ImportedDataset = ReturnType<typeof importTerytCsv>;
type ImportedRow = ImportedDataset["rows"][number];

const decoder = new TextDecoder();
const officialSourceUrl = "https://eteryt.stat.gov.pl/eTeryt/";

export class SqliteDatabaseBuilder implements DatabaseBuilder {
  async build(sourceFiles: readonly SourceFile[]): Promise<BuiltDatabase> {
    const SQL = await loadSqlJs();
    const db = new SQL.Database();

    try {
      const imports = parseSourceFiles(sourceFiles);

      if (!imports) {
        createSchema(db);
        db.run("BEGIN");
        insertMetadataOnly(db, sourceFiles);
        db.run("COMMIT");

        return {
          content: db.export(),
        };
      }

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

  const match = /^CREATE VIRTUAL TABLE (\w+) USING fts5\((\w+)/.exec(statement);

  if (!match) {
    return null;
  }

  return `CREATE TABLE ${match[1]} (${match[2]} TEXT)`;
}

function parseSourceFiles(sourceFiles: readonly SourceFile[]): readonly ImportedDataset[] | null {
  try {
    return sourceFiles.map((sourceFile) => importTerytCsv(decoder.decode(sourceFile.content)));
  } catch (error) {
    if (sourceFiles.every(isOfficialPlaceholderSource)) {
      return null;
    }

    throw error;
  }
}

function insertRawDatasets(db: Database, imports: readonly ImportedDataset[]): void {
  for (const imported of imports) {
    insertRows(db, `raw_${imported.dataset.toLowerCase()}`, imported.columns, imported.rows);
  }
}

function insertSearchTables(db: Database, imports: readonly ImportedDataset[]): void {
  const terc = findImport(imports, "TERC");
  const simc = findImport(imports, "SIMC");
  const ulic = findImport(imports, "ULIC");

  insertUnits(db, terc.rows);
  insertPlaces(db, simc.rows);
  insertStreets(db, ulic.rows);
  db.run("INSERT INTO units_fts(rowid, name) SELECT rowid, name FROM units");
  db.run("INSERT INTO places_fts(rowid, name) SELECT rowid, name FROM places");
  db.run("INSERT INTO streets_fts(rowid, name) SELECT rowid, name FROM streets");
}

function insertMetadata(db: Database, imports: readonly ImportedDataset[]): void {
  const metadata = [
    ["datasetCount", String(imports.length)],
    ["stateDates", imports.map((item) => `${item.dataset}:${item.stateDate}`).join(",")],
  ];

  for (const [key, value] of metadata) {
    db.run("INSERT INTO metadata (key, value) VALUES (?, ?)", [key, value]);
  }
}

function insertMetadataOnly(db: Database, sourceFiles: readonly SourceFile[]): void {
  const metadata = [
    ["datasetCount", String(sourceFiles.length)],
    ["sourceMode", "metadata-only"],
    ["stateDates", sourceFiles.map((item) => `${item.dataset}:${item.stateDate}`).join(",")],
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

function insertUnits(db: Database, rows: readonly ImportedRow[]): void {
  const statement = db.prepare(
    "INSERT INTO units (id, WOJ, POW, GMI, RODZ, name, type, stateDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  try {
    for (const row of rows) {
      statement.run([
        createUnitId(row.values),
        row.values.WOJ ?? "",
        row.values.POW ?? "",
        row.values.GMI ?? "",
        row.values.RODZ ?? "",
        row.values.NAZWA ?? "",
        row.values.NAZDOD ?? "",
        row.values.STAN_NA ?? "",
      ]);
    }
  } finally {
    statement.free();
  }
}

function insertPlaces(db: Database, rows: readonly ImportedRow[]): void {
  const statement = db.prepare(
    "INSERT INTO places (id, SYM, SYMPOD, RM, name, unitId, stateDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  try {
    for (const row of rows) {
      statement.run([
        row.values.SYM ?? "",
        row.values.SYM ?? "",
        row.values.SYMPOD ?? "",
        row.values.RM ?? "",
        row.values.NAZWA ?? "",
        createUnitId(row.values),
        row.values.STAN_NA ?? "",
      ]);
    }
  } finally {
    statement.free();
  }
}

function insertStreets(db: Database, rows: readonly ImportedRow[]): void {
  const statement = db.prepare(
    "INSERT INTO streets (id, SYM, SYM_UL, name, placeId, stateDate) VALUES (?, ?, ?, ?, ?, ?)",
  );

  try {
    for (const row of rows) {
      statement.run([
        `${row.values.SYM ?? ""}-${row.values.SYM_UL ?? ""}`,
        row.values.SYM ?? "",
        row.values.SYM_UL ?? "",
        [row.values.CECHA, row.values.NAZWA_1, row.values.NAZWA_2].filter(Boolean).join(" "),
        row.values.SYM ?? "",
        row.values.STAN_NA ?? "",
      ]);
    }
  } finally {
    statement.free();
  }
}

function findImport(imports: readonly ImportedDataset[], dataset: DatasetCode): ImportedDataset {
  const imported = imports.find((item) => item.dataset === dataset);

  if (!imported) {
    throw new Error(`Missing ${dataset} import.`);
  }

  return imported;
}

function createUnitId(values: Readonly<Record<string, string>>): string {
  return [values.WOJ ?? "", values.POW ?? "", values.GMI ?? "", values.RODZ ?? values.RODZ_GMI ?? ""].join("-");
}

function isOfficialPlaceholderSource(sourceFile: SourceFile): boolean {
  return (
    sourceFile.sourceUrl === officialSourceUrl &&
    sourceFile.stateDate === "unknown" &&
    decoder.decode(sourceFile.content).startsWith(`${sourceFile.dataset}\nsource=${officialSourceUrl}`)
  );
}

function rollback(db: Database): void {
  try {
    db.run("ROLLBACK");
  } catch {
    // Ignore rollback failures when the transaction was never opened.
  }
}

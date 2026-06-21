import type { Database } from "sql.js";

import { importTerytCsv } from "../application/importers/teryt-csv.js";
import type { DatasetCode } from "../domain/dataset.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";

type ImportedDataset = ReturnType<typeof importTerytCsv>;
type ImportedRow = ImportedDataset["rows"][number];

export function insertSearchTables(db: Database, imports: readonly ImportedDataset[]): void {
  const terc = findImport(imports, "TERC");
  const simc = findImport(imports, "SIMC");
  const ulic = findImport(imports, "ULIC");

  insertUnits(db, terc.rows);
  insertPlaces(db, simc.rows);
  insertStreets(db, ulic.rows);
}

function insertUnits(db: Database, rows: readonly ImportedRow[]): void {
  const statement = db.prepare(
    "INSERT INTO units (id, WOJ, POW, GMI, RODZ, name, normalizedName, type, stateDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        normalizePolishText(row.values.NAZWA ?? ""),
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
    "INSERT INTO places (id, SYM, SYMPOD, RM, name, normalizedName, unitId, stateDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  try {
    for (const row of rows) {
      statement.run([
        row.values.SYM ?? "",
        row.values.SYM ?? "",
        row.values.SYMPOD ?? "",
        row.values.RM ?? "",
        row.values.NAZWA ?? "",
        normalizePolishText(row.values.NAZWA ?? ""),
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
    "INSERT INTO streets (id, SYM, SYM_UL, name, normalizedName, placeId, stateDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  try {
    for (const row of rows) {
      const name = [row.values.NAZWA_2, row.values.NAZWA_1].filter(Boolean).join(" ");

      statement.run([
        `${row.values.SYM ?? ""}-${row.values.SYM_UL ?? ""}`,
        row.values.SYM ?? "",
        row.values.SYM_UL ?? "",
        name,
        normalizePolishText(name),
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
  return [values.WOJ, values.POW, values.GMI, values.RODZ ?? values.RODZ_GMI].filter(Boolean).join("-");
}

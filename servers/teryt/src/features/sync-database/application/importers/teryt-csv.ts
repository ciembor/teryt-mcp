import { createHash } from "node:crypto";

import type { DatasetCode } from "../../domain/dataset.js";

type TerytRow = {
  readonly dataset: DatasetCode;
  readonly values: Readonly<Record<string, string>>;
};

type TerytImport = {
  readonly columns: readonly string[];
  readonly dataset: DatasetCode;
  readonly recordCount: number;
  readonly rows: readonly TerytRow[];
  readonly stateDate: string;
};

type ImportTerytCsvOptions = {
  readonly expectedSha256?: string;
  readonly minRecordCount?: number;
};

const requiredColumns: Readonly<Record<DatasetCode, readonly string[]>> = {
  SIMC: ["WOJ", "POW", "GMI", "RODZ_GMI", "RM", "MZ", "NAZWA", "SYM", "SYMPOD", "STAN_NA"],
  TERC: ["WOJ", "POW", "GMI", "RODZ", "NAZWA", "NAZDOD", "STAN_NA"],
  ULIC: ["WOJ", "POW", "GMI", "RODZ_GMI", "SYM", "SYM_UL", "CECHA", "NAZWA_1", "NAZWA_2", "STAN_NA"],
  WMRODZ: ["RM", "NAZWA_RM", "STAN_NA"],
};

const detectionColumns: Readonly<Record<DatasetCode, readonly string[]>> = {
  SIMC: ["SYM", "SYMPOD", "RM"],
  TERC: ["RODZ"],
  ULIC: ["SYM_UL", "CECHA", "NAZWA_1"],
  WMRODZ: ["NAZWA_RM"],
};

export function importTerytCsv(content: string, options: ImportTerytCsvOptions = {}): TerytImport {
  const [headerLine, ...recordLines] = content.trim().split(/\r?\n/);

  if (!headerLine) {
    throw new Error("TERYT CSV is empty.");
  }

  validateSha256(content, options.expectedSha256);

  const columns = parseCsvLine(headerLine);
  const dataset = detectDataset(columns);
  validateColumns(dataset, columns);
  const rows = recordLines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);

    return {
      dataset,
      values: Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""])),
    };
  });
  const stateDate = validateStateDate(dataset, rows);
  validateRecordCount(dataset, rows.length, options.minRecordCount);

  return {
    columns,
    dataset,
    recordCount: rows.length,
    rows,
    stateDate,
  };
}

export function detectDataset(columns: readonly string[]): DatasetCode {
  const columnSet = new Set(columns);
  const matches = Object.entries(detectionColumns).filter(([, required]) =>
    required.every((column) => columnSet.has(column)),
  );

  if (matches.length !== 1) {
    throw new Error(`Cannot detect TERYT dataset from columns: ${columns.join(", ")}`);
  }

  return matches[0][0] as DatasetCode;
}

function validateColumns(dataset: DatasetCode, columns: readonly string[]): void {
  const columnSet = new Set(columns);
  const missing = requiredColumns[dataset].filter((column) => !columnSet.has(column));

  if (missing.length > 0) {
    throw new Error(`Missing ${dataset} columns: ${missing.join(", ")}`);
  }
}

function validateStateDate(dataset: DatasetCode, rows: readonly TerytRow[]): string {
  const stateDates = new Set(rows.map((row) => row.values.STAN_NA).filter(Boolean));

  if (stateDates.size !== 1) {
    throw new Error(`${dataset} must contain exactly one STAN_NA value.`);
  }

  const [stateDate] = stateDates;

  if (!stateDate || !/^\d{4}-\d{2}-\d{2}$/.test(stateDate)) {
    throw new Error(`${dataset} has invalid STAN_NA value.`);
  }

  return stateDate;
}

function validateRecordCount(dataset: DatasetCode, recordCount: number, minRecordCount = 1): void {
  if (recordCount < minRecordCount) {
    throw new Error(`${dataset} recordCount ${recordCount} is below minimum ${minRecordCount}.`);
  }
}

function validateSha256(content: string, expectedSha256: string | undefined): void {
  if (!expectedSha256) {
    return;
  }

  const actualSha256 = createHash("sha256").update(content).digest("hex");

  if (actualSha256 !== expectedSha256) {
    throw new Error(`TERYT CSV sha256 mismatch: expected ${expectedSha256}, got ${actualSha256}.`);
  }
}

function parseCsvLine(line: string): readonly string[] {
  const delimiter = line.includes(";") ? ";" : ",";
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === delimiter && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);

  return values;
}

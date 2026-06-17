import type { DatasetCode } from "../../domain/dataset.js";

type TerytRow = {
  readonly dataset: DatasetCode;
  readonly values: Readonly<Record<string, string>>;
};

type TerytImport = {
  readonly columns: readonly string[];
  readonly dataset: DatasetCode;
  readonly rows: readonly TerytRow[];
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

export function importTerytCsv(content: string): TerytImport {
  const [headerLine, ...recordLines] = content.trim().split(/\r?\n/);

  if (!headerLine) {
    throw new Error("TERYT CSV is empty.");
  }

  const columns = parseCsvLine(headerLine);
  const dataset = detectDataset(columns);
  validateColumns(dataset, columns);

  return {
    columns,
    dataset,
    rows: recordLines.filter(Boolean).map((line) => {
      const values = parseCsvLine(line);

      return {
        dataset,
        values: Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""])),
      };
    }),
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

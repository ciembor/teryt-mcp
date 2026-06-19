import type { DatasetCode } from "../../domain/dataset.js";

type ImportedRow = {
  readonly dataset: DatasetCode;
  readonly values: Readonly<Record<string, string>>;
};

type ImportedDataset = {
  readonly dataset: DatasetCode;
  readonly rows: readonly ImportedRow[];
};

export function validateTerytRelations(imports: readonly ImportedDataset[]): void {
  const simcRows = getRows(imports, "SIMC");
  const tercUnitIds = new Set(getRows(imports, "TERC").map((row) => createUnitId(row.values)));
  const simcIds = new Set(simcRows.map((row) => row.values.SYM).filter(Boolean));

  validateSimcUnits(simcRows, tercUnitIds);
  validateUlicPlaces(getRows(imports, "ULIC"), simcIds);
}

function validateSimcUnits(simcRows: readonly ImportedRow[], tercUnitIds: ReadonlySet<string>): void {
  for (const row of simcRows) {
    const unitId = createUnitId(row.values);

    if (!tercUnitIds.has(unitId)) {
      throw new Error(`SIMC ${row.values.SYM ?? "<unknown>"} references missing TERC unit ${unitId}.`);
    }
  }
}

function validateUlicPlaces(ulicRows: readonly ImportedRow[], simcIds: ReadonlySet<string>): void {
  for (const row of ulicRows) {
    const placeId = row.values.SYM;

    if (!placeId || !simcIds.has(placeId)) {
      throw new Error(`ULIC ${row.values.SYM_UL ?? "<unknown>"} references missing SIMC place ${placeId ?? "<empty>"}.`);
    }
  }
}

function getRows(imports: readonly ImportedDataset[], dataset: DatasetCode): readonly ImportedRow[] {
  return imports.find((item) => item.dataset === dataset)?.rows ?? [];
}

function createUnitId(values: Readonly<Record<string, string>>): string {
  return [values.WOJ ?? "", values.POW ?? "", values.GMI ?? "", values.RODZ ?? values.RODZ_GMI ?? ""].join("-");
}

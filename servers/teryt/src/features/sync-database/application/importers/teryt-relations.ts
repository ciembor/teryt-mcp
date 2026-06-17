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
  const tercUnitIds = new Set(
    imports
      .find((item) => item.dataset === "TERC")
      ?.rows.map((row) => createUnitId(row.values)) ?? [],
  );
  const simcIds = new Set(
    imports
      .find((item) => item.dataset === "SIMC")
      ?.rows.map((row) => row.values.SYM)
      .filter(Boolean) ?? [],
  );
  const simcRows = imports.find((item) => item.dataset === "SIMC")?.rows ?? [];
  const ulicRows = imports.find((item) => item.dataset === "ULIC")?.rows ?? [];

  for (const row of simcRows) {
    const unitId = createUnitId(row.values);

    if (!tercUnitIds.has(unitId)) {
      throw new Error(`SIMC ${row.values.SYM ?? "<unknown>"} references missing TERC unit ${unitId}.`);
    }
  }

  for (const row of ulicRows) {
    const placeId = row.values.SYM;

    if (!placeId || !simcIds.has(placeId)) {
      throw new Error(`ULIC ${row.values.SYM_UL ?? "<unknown>"} references missing SIMC place ${placeId ?? "<empty>"}.`);
    }
  }
}

function createUnitId(values: Readonly<Record<string, string>>): string {
  return [values.WOJ ?? "", values.POW ?? "", values.GMI ?? "", values.RODZ ?? values.RODZ_GMI ?? ""].join("-");
}

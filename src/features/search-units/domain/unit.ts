export type Unit = {
  readonly id: string;
  readonly name: string;
  readonly stateDate: string;
  readonly type: string;
};

export type UnitMatch = {
  readonly confidence: number;
  readonly matchedBy: "exact_code" | "exact_normalized_name" | "prefix" | "fts";
  readonly unit: Unit;
};

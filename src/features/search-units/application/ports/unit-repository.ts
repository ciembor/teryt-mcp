import type { Unit } from "../../domain/unit.js";

export type UnitRepository = {
  readonly findUnits: (query: string, limit: number) => Promise<readonly Unit[]>;
};

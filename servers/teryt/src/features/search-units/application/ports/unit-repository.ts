import type { Unit } from "../../domain/unit.js";

export type UnitRepository = {
  readonly listUnits: () => Promise<readonly Unit[]>;
};

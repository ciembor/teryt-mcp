import type { UnitDetails } from "../../domain/unit-details.js";

export type UnitDetailsRepository = {
  readonly getUnit: (id: string) => Promise<UnitDetails | null>;
};

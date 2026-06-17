import type { UnitRepository } from "../application/ports/unit-repository.js";
import type { Unit } from "../domain/unit.js";

const fixtureUnits: readonly Unit[] = [
  {
    id: "02",
    name: "DOLNOŚLĄSKIE",
    stateDate: "2026-01-01",
    type: "województwo",
  },
  {
    id: "02-01-01-1",
    name: "Bolesławiec",
    stateDate: "2026-01-01",
    type: "gmina miejska",
  },
  {
    id: "02-01-02-2",
    name: "Bolesławiec",
    stateDate: "2026-01-01",
    type: "gmina wiejska",
  },
];

export class InMemoryUnitRepository implements UnitRepository {
  async listUnits(): Promise<readonly Unit[]> {
    return fixtureUnits;
  }
}

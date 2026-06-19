import type { UnitRepository } from "../application/ports/unit-repository.js";
import type { Unit } from "../domain/unit.js";

const fixtureStateDate = "2026-01-01";

const fixtureUnits: readonly Unit[] = [
  {
    id: "02",
    name: "DOLNOŚLĄSKIE",
    stateDate: fixtureStateDate,
    type: "województwo",
  },
  {
    id: "02-01-01-1",
    name: "Bolesławiec",
    stateDate: fixtureStateDate,
    type: "gmina miejska",
  },
  {
    id: "02-01-02-2",
    name: "Bolesławiec",
    stateDate: fixtureStateDate,
    type: "gmina wiejska",
  },
];

export class InMemoryUnitRepository implements UnitRepository {
  async listUnits(): Promise<readonly Unit[]> {
    return fixtureUnits;
  }
}

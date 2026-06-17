import type { UnitDetailsRepository } from "../application/ports/unit-details-repository.js";
import type { UnitDetails } from "../domain/unit-details.js";

const fixtureUnits: readonly UnitDetails[] = [
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

export class InMemoryUnitDetailsRepository implements UnitDetailsRepository {
  async getUnit(id: string): Promise<UnitDetails | null> {
    return fixtureUnits.find((unit) => unit.id === id) ?? null;
  }
}

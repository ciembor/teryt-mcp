import type { UnitDetailsRepository } from "../application/ports/unit-details-repository.js";
import type { UnitDetails } from "../domain/unit-details.js";

const fixtureStateDate = "2026-01-01";

const fixtureUnits: readonly UnitDetails[] = [
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

export class InMemoryUnitDetailsRepository implements UnitDetailsRepository {
  async getUnit(id: string): Promise<UnitDetails | null> {
    return fixtureUnits.find((unit) => unit.id === id) ?? null;
  }
}

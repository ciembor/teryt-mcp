import type { StreetRepository } from "../application/ports/street-repository.js";
import type { Street } from "../domain/street.js";

const fixtureStreets: readonly Street[] = [
  {
    code: "0000123",
    id: "0009876-0000123",
    name: "Marszałkowska",
    placeId: "0009876",
    stateDate: "2026-01-01",
  },
  {
    code: "0000456",
    id: "0009876-0000456",
    name: "Rynek",
    placeId: "0009876",
    stateDate: "2026-01-01",
  },
];

export class InMemoryStreetRepository implements StreetRepository {
  async listStreets(): Promise<readonly Street[]> {
    return fixtureStreets;
  }
}

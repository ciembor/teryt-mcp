import type { StreetDetailsRepository } from "../application/ports/street-details-repository.js";
import type { StreetDetails } from "../domain/street-details.js";

const fixtureStreets: readonly StreetDetails[] = [
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

export class InMemoryStreetDetailsRepository implements StreetDetailsRepository {
  async getStreet(id: string): Promise<StreetDetails | null> {
    return fixtureStreets.find((street) => street.id === id || street.code === id) ?? null;
  }
}

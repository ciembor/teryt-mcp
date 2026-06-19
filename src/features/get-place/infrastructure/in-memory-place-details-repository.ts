import type { PlaceDetailsRepository } from "../application/ports/place-details-repository.js";
import type { PlaceDetails } from "../domain/place-details.js";

const fixturePlaces: readonly PlaceDetails[] = [
  {
    id: "0009876",
    name: "Bolesławiec",
    stateDate: "2026-01-01",
    unitId: "02-01-01-1",
  },
  {
    id: "0012345",
    name: "Stara Wieś",
    stateDate: "2026-01-01",
    unitId: "02-01-02-2",
  },
];

export class InMemoryPlaceDetailsRepository implements PlaceDetailsRepository {
  async getPlace(id: string): Promise<PlaceDetails | null> {
    return fixturePlaces.find((place) => place.id === id) ?? null;
  }
}

import type { PlaceRepository } from "../application/ports/place-repository.js";
import type { Place } from "../domain/place.js";

const fixturePlaces: readonly Place[] = [
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

export class InMemoryPlaceRepository implements PlaceRepository {
  async listPlaces(): Promise<readonly Place[]> {
    return fixturePlaces;
  }
}

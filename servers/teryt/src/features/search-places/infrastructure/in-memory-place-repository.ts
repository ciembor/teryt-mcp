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
    id: "0011111",
    name: "Kraków",
    stateDate: "2026-01-01",
    unitId: "12-61-01-1",
  },
  {
    id: "0012222",
    name: "Warszawa",
    stateDate: "2026-01-01",
    unitId: "14-65-01-1",
  },
  {
    id: "0012345",
    name: "Stara Wieś",
    stateDate: "2026-01-01",
    unitId: "02-01-02-2",
  },
  {
    id: "0013333",
    name: "Dąbrowa",
    stateDate: "2026-01-01",
    unitId: "24-01-01-2",
  },
];

export class InMemoryPlaceRepository implements PlaceRepository {
  async listPlaces(): Promise<readonly Place[]> {
    return fixturePlaces;
  }
}

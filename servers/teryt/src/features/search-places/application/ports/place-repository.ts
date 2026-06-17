import type { Place } from "../../domain/place.js";

export type PlaceRepository = {
  readonly listPlaces: () => Promise<readonly Place[]>;
};

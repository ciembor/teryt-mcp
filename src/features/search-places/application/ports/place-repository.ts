import type { Place } from "../../domain/place.js";

export type PlaceRepository = {
  readonly findPlaces: (query: string, limit: number) => Promise<readonly Place[]>;
};

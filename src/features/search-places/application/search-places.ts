import type { PlaceMatch } from "../domain/place.js";
import type { PlaceRepository } from "./ports/place-repository.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";
import { searchEntities } from "../../../shared/search-entities.js";

type SearchPlacesInput = {
  readonly limit?: number;
  readonly query: string;
};

export type SearchPlacesDependencies = {
  readonly placeRepository: PlaceRepository;
};

type SearchPlacesResult = {
  readonly places: readonly PlaceMatch[];
  readonly stateDate: string | null;
};

export async function searchPlaces(
  input: SearchPlacesInput,
  dependencies: SearchPlacesDependencies,
): Promise<SearchPlacesResult> {
  const result = await searchEntities({
    input,
    findCandidates: (query, limit) => dependencies.placeRepository.findPlaces(query, limit),
    normalize: normalizePolishText,
    operationName: "search_places",
  });
  const places: readonly PlaceMatch[] = result.matches.map(({ entity, ...match }) => ({ ...match, place: entity }));

  return {
    places,
    stateDate: result.stateDate,
  };
}

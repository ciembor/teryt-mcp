import type { PlaceMatch } from "../domain/place.js";
import type { PlaceRepository } from "./ports/place-repository.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";

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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function searchPlaces(
  input: SearchPlacesInput,
  dependencies: SearchPlacesDependencies,
): Promise<SearchPlacesResult> {
  const limit = normalizeLimit(input.limit);
  const query = input.query.trim();

  if (!query) {
    return {
      places: [],
      stateDate: null,
    };
  }

  const normalizedQuery = normalizePolishText(query);
  const places = await dependencies.placeRepository.findPlaces(query, candidateLimit(limit));
  const matches = places
    .flatMap((place): readonly PlaceMatch[] => {
      if (place.id === query) {
        return [
          {
            confidence: 1,
            matchedBy: "exact_code",
            place,
          },
        ];
      }

      const normalizedName = normalizePolishText(place.name);

      if (normalizedName === normalizedQuery) {
        return [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            place,
          },
        ];
      }

      if (normalizedName.startsWith(normalizedQuery)) {
        return [
          {
            confidence: 0.75,
            matchedBy: "prefix",
            place,
          },
        ];
      }

      if (normalizedName.includes(normalizedQuery)) {
        return [
          {
            confidence: 0.55,
            matchedBy: "contains",
            place,
          },
        ];
      }

      return [];
    })
    .sort((left, right) => right.confidence - left.confidence || left.place.name.localeCompare(right.place.name))
    .slice(0, limit);

  return {
    places: matches,
    stateDate: matches[0]?.place.stateDate ?? null,
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("search_places limit must be a positive integer.");
  }

  return Math.min(limit, MAX_LIMIT);
}

function candidateLimit(limit: number): number {
  return Math.max(100, limit * 10);
}

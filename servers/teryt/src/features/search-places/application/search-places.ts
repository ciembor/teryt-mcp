import type { PlaceMatch } from "../domain/place.js";
import type { PlaceRepository } from "./ports/place-repository.js";

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

  const normalizedQuery = normalizeName(query);
  const places = await dependencies.placeRepository.listPlaces();
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

      const normalizedName = normalizeName(place.name);

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

function normalizeName(value: string): string {
  return value
    .replaceAll("ł", "l")
    .replaceAll("Ł", "L")
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pl-PL");
}

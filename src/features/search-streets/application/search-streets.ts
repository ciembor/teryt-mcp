import type { StreetMatch } from "../domain/street.js";
import type { StreetRepository } from "./ports/street-repository.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";

type SearchStreetsInput = {
  readonly limit?: number;
  readonly query: string;
};

export type SearchStreetsDependencies = {
  readonly streetRepository: StreetRepository;
};

type SearchStreetsResult = {
  readonly stateDate: string | null;
  readonly streets: readonly StreetMatch[];
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function searchStreets(
  input: SearchStreetsInput,
  dependencies: SearchStreetsDependencies,
): Promise<SearchStreetsResult> {
  const limit = normalizeLimit(input.limit);
  const query = input.query.trim();

  if (!query) {
    return {
      stateDate: null,
      streets: [],
    };
  }

  const normalizedQuery = normalizePolishText(query);
  const streets = await dependencies.streetRepository.findStreets(query, candidateLimit(limit));
  const matches = streets
    .flatMap((street): readonly StreetMatch[] => {
      if (street.id === query || street.code === query) {
        return [
          {
            confidence: 1,
            matchedBy: "exact_code",
            street,
          },
        ];
      }

      const normalizedName = normalizePolishText(street.name);

      if (normalizedName === normalizedQuery) {
        return [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            street,
          },
        ];
      }

      if (normalizedName.startsWith(normalizedQuery)) {
        return [
          {
            confidence: 0.75,
            matchedBy: "prefix",
            street,
          },
        ];
      }

      if (normalizedName.includes(normalizedQuery)) {
        return [
          {
            confidence: 0.55,
            matchedBy: "contains",
            street,
          },
        ];
      }

      return [];
    })
    .sort((left, right) => right.confidence - left.confidence || left.street.name.localeCompare(right.street.name))
    .slice(0, limit);

  return {
    stateDate: matches[0]?.street.stateDate ?? null,
    streets: matches,
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("search_streets limit must be a positive integer.");
  }

  return Math.min(limit, MAX_LIMIT);
}

function candidateLimit(limit: number): number {
  return Math.max(100, limit * 10);
}

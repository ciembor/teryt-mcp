import type { Street, StreetMatch } from "../domain/street.js";
import type { StreetRepository } from "./ports/street-repository.js";
import { normalizeStreetText } from "../../../shared/normalize-street-text.js";
import { searchEntities } from "../../../shared/search-entities.js";

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

export async function searchStreets(
  input: SearchStreetsInput,
  dependencies: SearchStreetsDependencies,
): Promise<SearchStreetsResult> {
  const result = await searchEntities<Street>({
    input,
    candidateQuery: (_query, normalizedQuery) => normalizedQuery,
    exactCodes: (street) => [street.id, street.code],
    findCandidates: (query, limit) => dependencies.streetRepository.findStreets(query, limit),
    normalize: normalizeStreetText,
    operationName: "search_streets",
  });
  const streets: readonly StreetMatch[] = result.matches.map(({ entity, ...match }) => ({ ...match, street: entity }));

  return {
    stateDate: result.stateDate,
    streets,
  };
}

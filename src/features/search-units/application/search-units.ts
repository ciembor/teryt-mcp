import type { UnitMatch } from "../domain/unit.js";
import type { UnitRepository } from "./ports/unit-repository.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";
import { searchEntities } from "../../../shared/search-entities.js";

type SearchUnitsInput = {
  readonly limit?: number;
  readonly query: string;
};

export type SearchUnitsDependencies = {
  readonly unitRepository: UnitRepository;
};

type SearchUnitsResult = {
  readonly stateDate: string | null;
  readonly units: readonly UnitMatch[];
};

export async function searchUnits(
  input: SearchUnitsInput,
  dependencies: SearchUnitsDependencies,
): Promise<SearchUnitsResult> {
  const result = await searchEntities({
    input,
    findCandidates: (query, limit) => dependencies.unitRepository.findUnits(query, limit),
    normalize: normalizePolishText,
    operationName: "search_units",
  });
  const units: readonly UnitMatch[] = result.matches.map(({ entity, ...match }) => ({ ...match, unit: entity }));

  return {
    stateDate: result.stateDate,
    units,
  };
}

import type { UnitMatch } from "../domain/unit.js";
import type { UnitRepository } from "./ports/unit-repository.js";

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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function searchUnits(
  input: SearchUnitsInput,
  dependencies: SearchUnitsDependencies,
): Promise<SearchUnitsResult> {
  const query = input.query.trim();
  const limit = normalizeLimit(input.limit);

  if (!query) {
    return {
      stateDate: null,
      units: [],
    };
  }

  const normalizedQuery = normalizeName(query);
  const units = await dependencies.unitRepository.listUnits();
  const matches = units
    .flatMap((unit): readonly UnitMatch[] => {
      if (unit.id === query) {
        return [
          {
            confidence: 1,
            matchedBy: "exact_code",
            unit,
          },
        ];
      }

      const normalizedName = normalizeName(unit.name);

      if (normalizedName === normalizedQuery) {
        return [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            unit,
          },
        ];
      }

      if (normalizedName.startsWith(normalizedQuery)) {
        return [
          {
            confidence: 0.75,
            matchedBy: "prefix",
            unit,
          },
        ];
      }

      if (normalizedName.includes(normalizedQuery)) {
        return [
          {
            confidence: 0.55,
            matchedBy: "fts",
            unit,
          },
        ];
      }

      return [];
    })
    .sort((left, right) => right.confidence - left.confidence || left.unit.name.localeCompare(right.unit.name))
    .slice(0, limit);

  return {
    stateDate: matches[0]?.unit.stateDate ?? null,
    units: matches,
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("search_units limit must be a positive integer.");
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

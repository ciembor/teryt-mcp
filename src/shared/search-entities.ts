export const searchMatchKinds = ["exact_code", "exact_normalized_name", "prefix", "contains"] as const;

export type SearchMatchKind = (typeof searchMatchKinds)[number];

type NamedEntity = {
  readonly id: string;
  readonly name: string;
  readonly stateDate: string;
};

type SearchInput = {
  readonly limit?: number;
  readonly query: string;
};

type SearchOptions<TEntity extends NamedEntity> = {
  readonly candidateQuery?: (query: string, normalizedQuery: string) => string;
  readonly exactCodes?: (entity: TEntity) => readonly string[];
  readonly findCandidates: (query: string, limit: number) => Promise<readonly TEntity[]>;
  readonly input: SearchInput;
  readonly normalize: (value: string) => string;
  readonly operationName: string;
};

type ScoredEntity<TEntity> = {
  readonly confidence: number;
  readonly entity: TEntity;
  readonly matchedBy: SearchMatchKind;
};

type SearchResult<TEntity> = {
  readonly matches: readonly ScoredEntity<TEntity>[];
  readonly stateDate: string | null;
};

const defaultLimit = 20;
const maxLimit = 100;

export async function searchEntities<TEntity extends NamedEntity>(
  options: SearchOptions<TEntity>,
): Promise<SearchResult<TEntity>> {
  const query = options.input.query.trim();
  const limit = normalizeLimit(options.input.limit, options.operationName);
  const normalizedQuery = options.normalize(query);

  if (!query || !normalizedQuery) {
    return { matches: [], stateDate: null };
  }

  const repositoryQuery = options.candidateQuery?.(query, normalizedQuery) ?? query;
  const candidates = await options.findCandidates(repositoryQuery, Math.max(100, limit * 10));
  const matches = candidates
    .flatMap((entity) => scoreEntity(entity, query, normalizedQuery, options))
    .sort((left, right) => right.confidence - left.confidence || left.entity.name.localeCompare(right.entity.name))
    .slice(0, limit);

  return {
    matches,
    stateDate: matches[0]?.entity.stateDate ?? null,
  };
}

function scoreEntity<TEntity extends NamedEntity>(
  entity: TEntity,
  query: string,
  normalizedQuery: string,
  options: SearchOptions<TEntity>,
): readonly ScoredEntity<TEntity>[] {
  const codes = options.exactCodes?.(entity) ?? [entity.id];

  if (codes.includes(query)) {
    return [{ entity, confidence: 1, matchedBy: "exact_code" }];
  }

  const normalizedName = options.normalize(entity.name);

  if (normalizedName === normalizedQuery) {
    return [{ entity, confidence: 0.95, matchedBy: "exact_normalized_name" }];
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return [{ entity, confidence: 0.75, matchedBy: "prefix" }];
  }

  if (normalizedName.includes(normalizedQuery)) {
    return [{ entity, confidence: 0.55, matchedBy: "contains" }];
  }

  return [];
}

function normalizeLimit(limit: number | undefined, operationName: string): number {
  if (limit === undefined) {
    return defaultLimit;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`${operationName} limit must be a positive integer.`);
  }

  return Math.min(limit, maxLimit);
}

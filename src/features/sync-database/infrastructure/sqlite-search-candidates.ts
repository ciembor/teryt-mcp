import type { Database } from "sql.js";

import { normalizePolishText } from "../../../shared/normalize-polish-text.js";
import { queryMany, type SqlRow } from "./sqlite-query.js";
import { escapeLikePattern } from "./sqlite-like.js";

type SearchTable = "places" | "streets" | "units";

export function findSearchCandidates<T>(
  db: Database,
  table: SearchTable,
  query: string,
  limit: number,
  map: (row: SqlRow) => T,
  codeColumn?: "SYM_UL",
): readonly T[] {
  const normalizedQuery = normalizePolishText(query);
  const escapedQuery = escapeLikePattern(normalizedQuery);
  const codeClause = codeColumn ? ` OR ${codeColumn} = ?` : "";
  const whereParams = codeColumn
    ? [query, `%${escapedQuery}%`, query]
    : [query, `%${escapedQuery}%`];
  const exactCodeOrder = codeColumn ? `id = ? OR ${codeColumn} = ?` : "id = ?";
  const orderParams = codeColumn
    ? [query, query, normalizedQuery, `${escapedQuery}%`]
    : [query, normalizedQuery, `${escapedQuery}%`];
  const sql = `SELECT ${table}.*
    FROM ${table}
    WHERE id = ? OR normalizedName LIKE ? ESCAPE '\\'${codeClause}
    ORDER BY CASE
      WHEN ${exactCodeOrder} THEN 0
      WHEN normalizedName = ? THEN 1
      WHEN normalizedName LIKE ? ESCAPE '\\' THEN 2
      ELSE 3
    END, name, id
    LIMIT ?`;

  return queryMany(db, sql, [...whereParams, ...orderParams, limit], map);
}

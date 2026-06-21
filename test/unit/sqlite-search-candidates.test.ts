import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";

import { findSearchCandidates } from "../../src/features/sync-database/infrastructure/sqlite-search-candidates.js";

describe("findSearchCandidates", () => {
  it("orders exact normalized names before substring matches prior to LIMIT", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run("CREATE TABLE places (id TEXT, name TEXT, normalizedName TEXT)");

    for (let index = 0; index < 120; index += 1) {
      db.run("INSERT INTO places VALUES (?, ?, ?)", [`substring-${index}`, `A Kraków ${index}`, `a krakow ${index}`]);
    }
    db.run("INSERT INTO places VALUES (?, ?, ?)", ["exact", "Kraków", "krakow"]);

    const result = findSearchCandidates(db, "places", "Kraków", 1, (row) => row.id);

    expect(result).toEqual(["exact"]);
    db.close();
  });
});

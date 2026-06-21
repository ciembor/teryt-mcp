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

  it("treats SQL LIKE wildcard characters as literals", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run("CREATE TABLE places (id TEXT, name TEXT, normalizedName TEXT)");
    db.run("INSERT INTO places VALUES (?, ?, ?)", ["plain", "Kraków", "krakow"]);
    db.run("INSERT INTO places VALUES (?, ?, ?)", ["percent", "100% Test", "100% test"]);
    db.run("INSERT INTO places VALUES (?, ?, ?)", ["underscore", "A_B Test", "a_b test"]);

    try {
      expect(findSearchCandidates(db, "places", "%", 10, (row) => row.id)).toEqual(["percent"]);
      expect(findSearchCandidates(db, "places", "_", 10, (row) => row.id)).toEqual(["underscore"]);
    } finally {
      db.close();
    }
  });
});

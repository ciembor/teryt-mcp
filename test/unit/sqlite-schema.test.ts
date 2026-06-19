import { describe, expect, it } from "vitest";

import { terytSqliteSchema } from "../../src/features/sync-database/application/importers/sqlite-schema.js";

describe("terytSqliteSchema", () => {
  it("defines all target tables and FTS indexes", () => {
    const schema = terytSqliteSchema.join("\n");

    expect(schema).toContain("CREATE TABLE raw_terc");
    expect(schema).toContain("CREATE TABLE raw_simc");
    expect(schema).toContain("CREATE TABLE raw_ulic");
    expect(schema).toContain("CREATE TABLE raw_wmrodz");
    expect(schema).toContain("CREATE TABLE units");
    expect(schema).toContain("CREATE TABLE places");
    expect(schema).toContain("CREATE TABLE streets");
    expect(schema).toContain("CREATE TABLE metadata");
    expect(schema).toContain("CREATE VIRTUAL TABLE units_fts");
    expect(schema).toContain("CREATE VIRTUAL TABLE places_fts");
    expect(schema).toContain("CREATE VIRTUAL TABLE streets_fts");
  });

  it.each(["WOJ", "POW", "GMI", "RODZ", "RODZ_GMI", "SYM", "SYMPOD", "SYM_UL", "RM"])(
    "keeps %s as TEXT",
    (column) => {
      expect(terytSqliteSchema.join("\n")).toMatch(new RegExp(`${column} TEXT`));
    },
  );
});

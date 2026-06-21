import { describe, expect, it } from "vitest";

import { terytSqliteSchema } from "../../src/features/sync-database/application/importers/sqlite-schema.js";

describe("terytSqliteSchema", () => {
  it("defines all target tables and normalized-name indexes", () => {
    const schema = terytSqliteSchema.join("\n");

    expect(schema).toContain("CREATE TABLE raw_terc");
    expect(schema).toContain("CREATE TABLE raw_simc");
    expect(schema).toContain("CREATE TABLE raw_ulic");
    expect(schema).toContain("CREATE TABLE raw_wmrodz");
    expect(schema).toContain("CREATE TABLE units");
    expect(schema).toContain("CREATE TABLE places");
    expect(schema).toContain("CREATE TABLE streets");
    expect(schema).toContain("CREATE TABLE metadata");
    expect(schema).toContain("CREATE INDEX units_normalized_name_idx");
    expect(schema).toContain("CREATE INDEX places_normalized_name_idx");
    expect(schema).toContain("CREATE INDEX streets_normalized_name_idx");
  });

  it.each(["WOJ", "POW", "GMI", "RODZ", "RODZ_GMI", "SYM", "SYMPOD", "SYM_UL", "RM"])(
    "keeps %s as TEXT",
    (column) => {
      expect(terytSqliteSchema.join("\n")).toMatch(new RegExp(`${column} TEXT`));
    },
  );
});

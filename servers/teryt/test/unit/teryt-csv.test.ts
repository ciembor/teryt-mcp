import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectDataset, importTerytCsv } from "../../src/features/sync-database/application/importers/teryt-csv.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");

describe("importTerytCsv", () => {
  it.each([
    ["TERC", "TERC.csv"],
    ["SIMC", "SIMC.csv"],
    ["ULIC", "ULIC.csv"],
    ["WMRODZ", "WMRODZ.csv"],
  ])("detects and imports %s fixture", async (dataset, fileName) => {
    const csv = await readFile(join(fixtureDir, fileName), "utf8");
    const result = importTerytCsv(csv);

    expect(result.dataset).toBe(dataset);
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("keeps TERYT codes as text with leading zeroes", async () => {
    const csv = await readFile(join(fixtureDir, "SIMC.csv"), "utf8");
    const result = importTerytCsv(csv);

    expect(result.rows[0]?.values.SYM).toBe("0009876");
  });

  it("rejects missing required columns", () => {
    expect(() => importTerytCsv("WOJ;POW;GMI;RODZ\n02;01;01;1")).toThrow(/Missing TERC columns/);
  });

  it("rejects ambiguous dataset detection", () => {
    expect(() => detectDataset(["WOJ", "POW"])).toThrow(/Cannot detect/);
  });
});

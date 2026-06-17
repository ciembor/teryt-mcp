import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
    expect(result.recordCount).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.stateDate).toBe("2026-01-01");
  });

  it("keeps TERYT codes as text with leading zeroes", async () => {
    const csv = await readFile(join(fixtureDir, "SIMC.csv"), "utf8");
    const result = importTerytCsv(csv);

    expect(result.rows[0]?.values.SYM).toBe("0009876");
  });

  it("rejects missing required columns", () => {
    expect(() => importTerytCsv("WOJ;POW;GMI;RODZ\n02;01;01;1")).toThrow(/Missing TERC columns/);
  });

  it("rejects inconsistent STAN_NA values", () => {
    expect(() =>
      importTerytCsv(
        [
          "RM;NAZWA_RM;STAN_NA",
          "01;miasto;2026-01-01",
          "02;wieś;2026-01-02",
        ].join("\n"),
      ),
    ).toThrow(/STAN_NA/);
  });

  it("rejects fixtures below the minimum record count", async () => {
    const csv = await readFile(join(fixtureDir, "WMRODZ.csv"), "utf8");

    expect(() => importTerytCsv(csv, { minRecordCount: 3 })).toThrow(/recordCount/);
  });

  it("validates source file sha256 when expected hash is provided", async () => {
    const csv = await readFile(join(fixtureDir, "TERC.csv"), "utf8");
    const expectedSha256 = createHash("sha256").update(csv).digest("hex");

    expect(importTerytCsv(csv, { expectedSha256 }).recordCount).toBe(3);
    expect(() => importTerytCsv(csv, { expectedSha256: "invalid" })).toThrow(/sha256 mismatch/);
  });

  it("rejects ambiguous dataset detection", () => {
    expect(() => detectDataset(["WOJ", "POW"])).toThrow(/Cannot detect/);
  });
});

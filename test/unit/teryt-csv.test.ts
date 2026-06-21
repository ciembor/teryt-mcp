import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { detectDataset, importTerytCsv } from "../../src/features/sync-database/application/importers/teryt-csv.js";
import { importTerytZip } from "../../src/features/sync-database/application/importers/teryt-zip.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");

describe("importTerytCsv", () => {
  it.each([
    ["TERC", "TERC.csv"],
    ["SIMC", "SIMC.csv"],
    ["ULIC", "ULIC.csv"],
    ["WMRODZ", "WMRODZ.csv"],
  ])("detects and imports %s fixture", async (dataset, fileName) => {
    const csv = await readFile(join(fixtureDir, fileName), "utf8");
    const result = await importTerytCsv(csv);

    expect(result.dataset).toBe(dataset);
    expect(result.recordCount).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.stateDate).toBe("2026-01-01");
  });

  it("keeps TERYT codes as text with leading zeroes", async () => {
    const csv = await readFile(join(fixtureDir, "SIMC.csv"), "utf8");
    const result = await importTerytCsv(csv);

    expect(result.rows[0]?.values.SYM).toBe("0009876");
  });

  it("normalizes the current official TERC NAZWA_DOD column", async () => {
    const result = await importTerytCsv(
      "WOJ;POW;GMI;RODZ;NAZWA;NAZWA_DOD;STAN_NA\n02;01;01;1;Bolesławiec;gmina miejska;2026-01-01",
    );

    expect(result.dataset).toBe("TERC");
    expect(result.columns).toContain("NAZDOD");
    expect(result.rows[0]?.values.NAZDOD).toBe("gmina miejska");
  });

  it("handles BOM, escaped quotes and multiline quoted fields", async () => {
    const result = await importTerytCsv(
      '\uFEFFRM;NAZWA_RM;STAN_NA\n01;"miasto ""stołeczne""\nwielkie";2026-01-01',
    );

    expect(result.columns[0]).toBe("RM");
    expect(result.rows[0]?.values.NAZWA_RM).toBe('miasto "stołeczne"\nwielkie');
  });

  it("parses quoted fields across input chunk boundaries", async () => {
    const name = `miasto;${"x".repeat(70_000)}`;
    const result = await importTerytCsv(`RM;NAZWA_RM;STAN_NA\n01;"${name}";2026-01-01`);

    expect(result.rows[0]?.values.NAZWA_RM).toBe(name);
  });

  it("tolerates quotes inside unquoted official name fields", async () => {
    const result = await importTerytCsv('RM;NAZWA_RM;STAN_NA\n01;Kuncewicza ";2026-01-01');

    expect(result.rows[0]?.values.NAZWA_RM).toBe('Kuncewicza "');
  });

  it("rejects missing required columns", async () => {
    await expect(importTerytCsv("WOJ;POW;GMI;RODZ\n02;01;01;1")).rejects.toThrow(/Missing TERC columns/);
  });

  it("rejects inconsistent STAN_NA values", async () => {
    await expect(
      importTerytCsv(
        [
          "RM;NAZWA_RM;STAN_NA",
          "01;miasto;2026-01-01",
          "02;wieś;2026-01-02",
        ].join("\n"),
      ),
    ).rejects.toThrow(/STAN_NA/);
  });

  it("rejects fixtures below the minimum record count", async () => {
    const csv = await readFile(join(fixtureDir, "WMRODZ.csv"), "utf8");

    await expect(importTerytCsv(csv, { minRecordCount: 3 })).rejects.toThrow(/recordCount/);
  });

  it("validates source file sha256 when expected hash is provided", async () => {
    const csv = await readFile(join(fixtureDir, "TERC.csv"), "utf8");
    const expectedSha256 = createHash("sha256").update(csv).digest("hex");

    await expect(importTerytCsv(csv, { expectedSha256 })).resolves.toMatchObject({ recordCount: 7 });
    await expect(importTerytCsv(csv, { expectedSha256: "invalid" })).rejects.toThrow(/sha256 mismatch/);
  });

  it("imports TERYT CSV from ZIP archives", async () => {
    const csv = await readFile(join(fixtureDir, "TERC.csv"), "utf8");
    const zip = zipSync({
      "TERC.csv": strToU8(csv),
    });

    await expect(importTerytZip(zip)).resolves.toMatchObject({ dataset: "TERC" });
  });

  it("rejects ZIP archives without CSV entries", async () => {
    const zip = zipSync({
      "README.txt": strToU8("no csv"),
    });

    await expect(importTerytZip(zip)).rejects.toThrow(/does not contain a CSV/);
  });

  it("selects the expected dataset from ZIP archives with multiple CSV files", async () => {
    const [terc, simc] = await Promise.all([
      readFile(join(fixtureDir, "TERC.csv"), "utf8"),
      readFile(join(fixtureDir, "SIMC.csv"), "utf8"),
    ]);
    const zip = zipSync({ "TERC.csv": strToU8(terc), "SIMC.csv": strToU8(simc) });

    await expect(importTerytZip(zip, "SIMC")).resolves.toMatchObject({ dataset: "SIMC" });
  });

  it("rejects ambiguous dataset detection", () => {
    expect(() => detectDataset(["WOJ", "POW"])).toThrow(/Cannot detect/);
  });
});

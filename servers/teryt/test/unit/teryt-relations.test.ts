import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { importTerytCsv } from "../../src/features/sync-database/application/importers/teryt-csv.js";
import { validateTerytRelations } from "../../src/features/sync-database/application/importers/teryt-relations.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");

describe("validateTerytRelations", () => {
  it("accepts coherent fixture relations", async () => {
    const imports = await loadFixtures();

    expect(() => validateTerytRelations(imports)).not.toThrow();
  });

  it("rejects SIMC rows without matching TERC units", async () => {
    const imports = await loadFixtures();
    const simc = imports.find((item) => item.dataset === "SIMC");

    expect(() =>
      validateTerytRelations([
        imports.find((item) => item.dataset === "TERC")!,
        {
          dataset: "SIMC",
          rows: [
            {
              dataset: "SIMC",
              values: {
                ...simc!.rows[0]!.values,
                GMI: "99",
              },
            },
          ],
        },
      ]),
    ).toThrow(/missing TERC/);
  });

  it("rejects ULIC rows without matching SIMC places", async () => {
    const imports = await loadFixtures();
    const ulic = imports.find((item) => item.dataset === "ULIC");

    expect(() =>
      validateTerytRelations([
        imports.find((item) => item.dataset === "TERC")!,
        imports.find((item) => item.dataset === "SIMC")!,
        {
          dataset: "ULIC",
          rows: [
            {
              dataset: "ULIC",
              values: {
                ...ulic!.rows[0]!.values,
                SYM: "9999999",
              },
            },
          ],
        },
      ]),
    ).toThrow(/missing SIMC/);
  });
});

async function loadFixtures() {
  return Promise.all(
    ["TERC.csv", "SIMC.csv", "ULIC.csv"].map(async (fileName) =>
      importTerytCsv(await readFile(join(fixtureDir, fileName), "utf8")),
    ),
  );
}

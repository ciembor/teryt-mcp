import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { describe, expect, it } from "vitest";

import { importTerytCsv } from "../../src/features/sync-database/application/importers/teryt-csv.js";
import { validateTerytRelations } from "../../src/features/sync-database/application/importers/teryt-relations.js";
import { syncDatabase } from "../../src/features/sync-database/index.js";
import type { SourceFile } from "../../src/features/sync-database/application/ports/teryt-source.js";
import type { DatasetCode } from "../../src/features/sync-database/domain/dataset.js";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");

describe("syncDatabase from TERYT fixtures", () => {
  it("downloads fixture datasets, validates relations, swaps database, and writes manifest", async () => {
    const swaps: Uint8Array[] = [];
    const snapshots: unknown[] = [];

    const result = await syncDatabase({
      databaseBuilder: {
        build: async (sourceFiles) => {
          const imports = sourceFiles.map((sourceFile) => importTerytCsv(decoder.decode(sourceFile.content)));

          validateTerytRelations(imports);

          return {
            content: encoder.encode(
              JSON.stringify({
                datasets: imports.map((item) => ({
                  dataset: item.dataset,
                  recordCount: item.recordCount,
                  stateDate: item.stateDate,
                })),
              }),
            ),
          };
        },
      },
        fileStore: {
          databaseExists: async () => false,
          databaseModifiedAt: async () => null,
          databaseSchemaVersion: async () => null,
          swapDatabase: async (content) => {
          swaps.push(content);
          return "test-data/teryt.sqlite";
        },
      },
      lockStore: {
        withSyncLock: async (callback) => callback(),
      },
      manifestStore: {
        writeSnapshot: async (snapshot) => {
          snapshots.push(snapshot);
        },
      },
      mode: "force",
      now: () => new Date("2026-01-01T00:00:00.000Z"),
      source: {
        download: async (dataset) => loadFixtureSource(dataset),
      },
    });

    expect(result.status).toBe("synced");
    expect(result.databasePath).toBe("test-data/teryt.sqlite");
    expect(result.datasets.map((item) => item.dataset)).toEqual(["TERC", "SIMC", "ULIC", "WMRODZ"]);
    expect(result.datasets.every((item) => item.stateDate === "2026-01-01")).toBe(true);
    expect(swaps).toHaveLength(1);
    expect(JSON.parse(decoder.decode(swaps[0]))).toEqual({
      datasets: [
        { dataset: "TERC", recordCount: 7, stateDate: "2026-01-01" },
        { dataset: "SIMC", recordCount: 5, stateDate: "2026-01-01" },
        { dataset: "ULIC", recordCount: 2, stateDate: "2026-01-01" },
        { dataset: "WMRODZ", recordCount: 2, stateDate: "2026-01-01" },
      ],
    });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      builtAt: "2026-01-01T00:00:00.000Z",
      path: "test-data/teryt.sqlite",
    });
  });
});

async function loadFixtureSource(dataset: DatasetCode): Promise<SourceFile> {
  return {
    content: await readFile(join(fixtureDir, `${dataset}.csv`)),
    dataset,
    sourceUrl: `fixture://${dataset}.csv`,
    stateDate: "2026-01-01",
  };
}

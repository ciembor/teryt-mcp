import { describe, expect, it } from "vitest";

import { syncDatabase } from "../../src/features/sync-database/index.js";
import { createFixtureSyncSource } from "../support/fixture-sync-source.js";

describe("syncDatabase", () => {
  it("does not swap the previous database when sync fails before build output", async () => {
    const swaps: Uint8Array[] = [];
    const manifests: unknown[] = [];

    await expect(
      syncDatabase({
        databaseBuilder: {
          build: async () => {
            throw new Error("invalid source files");
          },
        },
        databaseIsUsable: async () => true,
        fileStore: {
          databaseExists: async () => true,
          databaseModifiedAt: async () => new Date("2026-01-01T00:00:00.000Z"),
          databaseSchemaVersion: async () => 2,
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
            manifests.push(snapshot);
          },
        },
        mode: "force",
        now: () => new Date("2026-01-01T00:00:00.000Z"),
        source: createFixtureSyncSource(),
      }),
    ).rejects.toThrow("invalid source files");

    expect(swaps).toEqual([]);
    expect(manifests).toEqual([]);
  });

  it("passes parsed imports to the database builder", async () => {
    const imports: unknown[] = [];

    await syncDatabase({
      databaseBuilder: {
        build: async (input) => {
          imports.push(...input);
          return { content: new Uint8Array([1, 2, 3]) };
        },
      },
      databaseIsUsable: async () => false,
      fileStore: {
        databaseExists: async () => false,
        databaseModifiedAt: async () => null,
        databaseSchemaVersion: async () => null,
        swapDatabase: async () => "test-data/teryt.sqlite",
      },
      lockStore: {
        withSyncLock: async (callback) => callback(),
      },
      manifestStore: {
        writeSnapshot: async () => {},
      },
      mode: "missing",
      now: () => new Date("2026-01-01T00:00:00.000Z"),
      source: createFixtureSyncSource(),
    });

    expect(imports).toHaveLength(4);
    expect(imports.map((item) => (item as { dataset: string }).dataset).sort()).toEqual([
      "SIMC",
      "TERC",
      "ULIC",
      "WMRODZ",
    ]);
  });
});

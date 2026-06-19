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
        fileStore: {
          databaseExists: async () => true,
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
});

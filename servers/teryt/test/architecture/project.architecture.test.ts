import { describe, expect, it } from "vitest";

import { createRegistry } from "../../src/mcp/registry.js";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    const registry = createRegistry({
      config: {
        dataDir: "test-data/teryt-mcp",
        port: 3000,
        transport: "stdio",
      },
      manifestStore: {
        getSnapshot: async () => undefined,
      },
      placeRepository: {
        listPlaces: async () => [],
      },
      sourceCatalog: {
        listDatasets: async () => [],
      },
      sync: {
        databaseBuilder: {
          build: async () => ({
            content: new Uint8Array(),
          }),
        },
        fileStore: {
          databaseExists: async () => false,
          swapDatabase: async () => "test-data/teryt.sqlite",
        },
        lockStore: {
          withSyncLock: async (callback) => callback(),
        },
        manifestStore: {
          writeSnapshot: async () => undefined,
        },
        now: () => new Date("2026-01-01T00:00:00.000Z"),
        source: {
          download: async (dataset) => ({
            content: new Uint8Array(),
            dataset,
            sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            stateDate: "unknown",
          }),
        },
      },
    });

    expect(registry.capabilities.map((capability) => capability.name)).toEqual([
      "health_status",
      "search_places",
      "server_status",
      "source_status",
      "sync_database",
    ]);
  });
});

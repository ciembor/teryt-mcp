import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { createRegistry } from "../../src/mcp/registry.js";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    const registry = createRegistry({
      addressRepository: {
        listAddresses: async () => [],
      },
      unitDetailsRepository: {
        getUnit: async () => null,
      },
      config: {
        dataDir: "test-data/teryt-mcp",
        port: 3000,
        transport: "stdio",
      },
      manifestStore: {
        getSnapshot: async () => undefined,
      },
      placeDetailsRepository: {
        getPlace: async () => null,
      },
      placeRepository: {
        listPlaces: async () => [],
      },
      streetRepository: {
        listStreets: async () => [],
      },
      streetDetailsRepository: {
        getStreet: async () => null,
      },
      unitRepository: {
        listUnits: async () => [],
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
      "get_place",
      "get_street",
      "get_unit",
      "health_status",
      "resolve_address",
      "search_places",
      "search_streets",
      "search_units",
      "server_status",
      "source_status",
      "sync_database",
    ]);
  });

  it("uses framework packages only through public package exports", async () => {
    const sourceFiles = [
      "src/app.ts",
      "src/cli.ts",
      "src/mcp/registry.ts",
      "src/server/serve.ts",
      "src/features/health/mcp/health.tool.ts",
      "src/features/server-status/mcp/server-status.tool.ts",
      "src/features/source-status/mcp/source-status.tool.ts",
      "src/features/sync-database/infrastructure/file-lock-store.ts",
      "src/features/sync-database/infrastructure/json-manifest-store.ts",
      "src/features/sync-database/infrastructure/local-file-store.ts",
      "src/features/sync-database/mcp/sync-database.tool.ts",
      "src/features/search-units/mcp/search-units.tool.ts",
      "src/features/search-places/mcp/search-places.tool.ts",
      "src/features/search-streets/mcp/search-streets.tool.ts",
      "src/features/resolve-address/mcp/resolve-address.tool.ts",
      "src/features/get-unit/mcp/get-unit.tool.ts",
      "src/features/get-place/mcp/get-place.tool.ts",
      "src/features/get-street/mcp/get-street.tool.ts",
    ];

    for (const file of sourceFiles) {
      const source = await readFile(new URL(`../../${file}`, import.meta.url), "utf8");

      expect(source, file).not.toContain("@mcp-craftman/core/");
      expect(source, file).not.toContain("@mcp-craftman/node/");
      expect(source, file).not.toContain("@mcp-craftman/cli/");
    }
  });
});

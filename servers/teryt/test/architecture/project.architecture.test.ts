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
      sourceCatalog: {
        listDatasets: async () => [],
      },
    });

    expect(registry.capabilities.map((capability) => capability.name)).toEqual([
      "health_status",
      "server_status",
      "source_status",
    ]);
  });
});

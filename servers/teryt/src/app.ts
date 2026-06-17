import { createMcpApp } from "@mcp-kit/core";
import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-kit/node";

import { EterytSourceCatalog } from "./features/source-status/infrastructure/eteryt-source-catalog.js";
import { JsonManifestStore } from "./features/source-status/infrastructure/json-manifest-store.js";
import { createRegistry } from "./mcp/registry.js";

export function createApp(config: RuntimeConfig = loadRuntimeConfig()) {
  const sourceCatalog = new EterytSourceCatalog();
  const manifestStore = new JsonManifestStore(config.dataDir);

  return createMcpApp({
    name: "teryt-mcp",
    version: "0.0.0",
    registry: createRegistry({
      config,
      manifestStore,
      sourceCatalog,
    }),
  });
}

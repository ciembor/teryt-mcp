import { createCapabilityRegistry } from "@mcp-kit/core";
import type { RuntimeConfig } from "@mcp-kit/node";

import { healthTool } from "../features/health/index.js";
import { createServerStatusTool } from "../features/server-status/index.js";
import { createSourceStatusTool, type ManifestStore, type TerytSourceCatalog } from "../features/source-status/index.js";

type CreateRegistryInput = {
  readonly config: RuntimeConfig;
  readonly manifestStore: ManifestStore;
  readonly sourceCatalog: TerytSourceCatalog;
};

export function createRegistry(input: CreateRegistryInput) {
  return createCapabilityRegistry([
    healthTool,
    createServerStatusTool({
      dataDir: input.config.dataDir,
      transport: input.config.transport,
    }),
    createSourceStatusTool({
      manifestStore: input.manifestStore,
      sourceCatalog: input.sourceCatalog,
    }),
  ]);
}

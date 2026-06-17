import { createCapabilityRegistry } from "@mcp-kit/core";
import type { RuntimeConfig } from "@mcp-kit/node";

import { healthTool } from "../features/health/index.js";
import { createServerStatusTool } from "../features/server-status/index.js";

export function createRegistry(config: RuntimeConfig) {
  return createCapabilityRegistry([
    healthTool,
    createServerStatusTool({
      dataDir: config.dataDir,
      transport: config.transport,
    }),
  ]);
}

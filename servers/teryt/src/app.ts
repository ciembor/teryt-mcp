import { createMcpApp } from "@mcp-kit/core";
import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-kit/node";

import { createRegistry } from "./mcp/registry.js";

export function createApp(config: RuntimeConfig = loadRuntimeConfig()) {
  return createMcpApp({
    name: "teryt-mcp",
    version: "0.0.0",
    registry: createRegistry(config),
  });
}

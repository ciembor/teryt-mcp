import { createMcpApp } from "@mcp-kit/core";

import { registry } from "./mcp/registry.js";

export function createApp() {
  return createMcpApp({
    name: "teryt-mcp",
    version: "0.0.0",
    registry,
  });
}

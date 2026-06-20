import { loadRuntimeConfig, serveMcpApp, type RuntimeConfig } from "@mcp-craftman/node";

import { createApp } from "../app.js";

export async function serve(config: RuntimeConfig = loadRuntimeConfig()) {
  return serveMcpApp(createApp, {
    config,
  });
}

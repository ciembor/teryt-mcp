import { serveMcpApp, type RuntimeConfig } from "@mcp-craftman/node";

import { createApp } from "../app.js";
import { loadTerytRuntimeConfig } from "../runtime/config.js";

export async function serve(config: RuntimeConfig = loadTerytRuntimeConfig()) {
  return serveMcpApp(createApp, {
    config,
  });
}

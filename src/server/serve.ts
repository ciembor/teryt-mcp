import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-craftman/node";

import { createApp } from "../app.js";
import { startHttpTransport } from "./transports/http.js";
import { startStdioTransport } from "./transports/stdio.js";

export async function serve(config: RuntimeConfig = loadRuntimeConfig()) {
  const app = createApp(config);

  if (config.transport === "http") {
    return startHttpTransport(app, {
      port: config.port,
    });
  }

  return startStdioTransport(app);
}

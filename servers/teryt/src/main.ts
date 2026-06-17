import { loadRuntimeConfig } from "@mcp-kit/node";

import { createApp } from "./app.js";
import { startHttpTransport } from "./server/transports/http.js";
import { startStdioTransport } from "./server/transports/stdio.js";

const app = createApp();
const config = loadRuntimeConfig();

if (config.transport === "http") {
  await startHttpTransport(app, {
    port: config.port,
  });
} else {
  startStdioTransport(app);
}

import { startHttpServer, type HttpServerOptions } from "@mcp-craftman/node";
import type { McpApp } from "@mcp-craftman/core";

export function startHttpTransport(app: McpApp, options: HttpServerOptions = {}) {
  return startHttpServer(app, options);
}

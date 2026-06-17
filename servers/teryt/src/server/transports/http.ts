import { startHttpServer, type HttpServerOptions } from "@mcp-kit/node";
import type { McpApp } from "@mcp-kit/core";

export function startHttpTransport(app: McpApp, options: HttpServerOptions = {}) {
  return startHttpServer(app, options);
}

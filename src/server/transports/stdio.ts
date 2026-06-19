import { startStdioServer, type StdioServerOptions } from "@mcp-craftman/node";
import type { McpApp } from "@mcp-craftman/core";

export function startStdioTransport(app: McpApp, options: StdioServerOptions = {}) {
  return startStdioServer(app, options);
}

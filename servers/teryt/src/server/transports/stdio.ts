import { startStdioServer, type StdioServerOptions } from "@mcp-kit/node";
import type { McpApp } from "@mcp-kit/core";

export function startStdioTransport(app: McpApp, options: StdioServerOptions = {}) {
  return startStdioServer(app, options);
}

import { callTool, type McpApp } from "@mcp-craftsman/core";
import { isCliEntrypoint } from "@mcp-craftsman/node";

import { createApp } from "./app.js";
import { loadTerytRuntimeConfig } from "./runtime/config.js";

type PostinstallIo = {
  readonly env: NodeJS.ProcessEnv;
  readonly stderr: NodeJS.WritableStream;
};

type PostinstallOptions = {
  readonly appFactory?: typeof createApp;
  readonly io?: PostinstallIo;
};

const skipValues = new Set(["1", "true", "yes"]);

export async function runPostinstallSync(options: PostinstallOptions = {}): Promise<void> {
  const io = options.io ?? {
    env: process.env,
    stderr: process.stderr,
  };

  if (skipValues.has((io.env.TERYT_MCP_SKIP_POSTINSTALL_SYNC ?? "").toLowerCase())) {
    io.stderr.write("teryt-mcp postinstall: skipping initial sync.\n");
    return;
  }

  const config = loadTerytRuntimeConfig(io.env);
  const appFactory = options.appFactory ?? createApp;
  const result = await callTool(appFactory(config) as McpApp, "sync_database", {
    mode: "missing",
  });
  const status = readStatus(result.structuredContent);

  io.stderr.write(`teryt-mcp postinstall: initial sync ${status} in ${config.dataDir}.\n`);
}

function readStatus(content: unknown): string {
  if (typeof content === "object" && content !== null && "status" in content && typeof content.status === "string") {
    return content.status;
  }

  return "completed";
}

if (isCliEntrypoint("postinstall.js")) {
  runPostinstallSync().catch((error: unknown) => {
    process.stderr.write(`teryt-mcp postinstall: initial sync failed: ${error instanceof Error ? error.message : String(error)}\n`);
  });
}

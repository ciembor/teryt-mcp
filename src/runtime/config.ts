import { homedir } from "node:os";
import { resolve } from "node:path";

import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-craftman/node";

export function loadTerytRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const config = loadRuntimeConfig(env);

  return {
    ...config,
    dataDir: resolveTerytDataDir(env),
  };
}

function resolveTerytDataDir(env: NodeJS.ProcessEnv): string {
  if (env.MCP_DATA_DIR) {
    return resolve(env.MCP_DATA_DIR);
  }

  if (env.XDG_CACHE_HOME) {
    return resolve(env.XDG_CACHE_HOME, "teryt-mcp");
  }

  if (process.platform === "darwin") {
    return resolve(homedir(), "Library", "Caches", "teryt-mcp");
  }

  if (process.platform === "win32" && env.LOCALAPPDATA) {
    return resolve(env.LOCALAPPDATA, "teryt-mcp");
  }

  return resolve(homedir(), ".cache", "teryt-mcp");
}

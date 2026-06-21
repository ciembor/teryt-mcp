import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-craftsman/node";

export function loadTerytRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return loadRuntimeConfig({ appName: "teryt-mcp", env });
}

import type { RuntimeConfig } from "@mcp-craftsman/node";

export function createTestRuntimeConfig(config: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    configDir: "test-config/teryt-mcp",
    dataDir: "test-data/teryt-mcp",
    logLevel: "silent",
    port: 3000,
    transport: "stdio",
    ...config,
  };
}

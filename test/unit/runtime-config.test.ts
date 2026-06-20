import { homedir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadTerytRuntimeConfig } from "../../src/runtime/config.js";

describe("TERYT runtime config", () => {
  it("keeps explicit MCP_DATA_DIR", () => {
    expect(
      loadTerytRuntimeConfig({
        MCP_DATA_DIR: "custom-data",
      }).dataDir,
    ).toBe(resolve("custom-data"));
  });

  it("uses an application-specific cache directory by default", () => {
    const config = loadTerytRuntimeConfig({});

    expect(config.dataDir).toContain("teryt-mcp");
    expect(config.dataDir).not.toContain("mcp-craftsman");
  });

  it("uses XDG_CACHE_HOME when available", () => {
    expect(
      loadTerytRuntimeConfig({
        XDG_CACHE_HOME: "xdg-cache",
      }).dataDir,
    ).toBe(resolve("xdg-cache", "teryt-mcp"));
  });

  it("falls back to the user cache directory", () => {
    const config = loadTerytRuntimeConfig({});

    if (process.platform === "darwin") {
      expect(config.dataDir).toBe(resolve(homedir(), "Library", "Caches", "teryt-mcp"));
      return;
    }

    expect(config.dataDir).toBe(resolve(homedir(), ".cache", "teryt-mcp"));
  });
});

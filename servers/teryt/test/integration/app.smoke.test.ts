import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";

describe("app", () => {
  it("creates an MCP app", () => {
    const app = createApp({
      dataDir: "test-data/teryt-mcp",
      port: 3000,
      transport: "stdio",
    });

    expect(app.registry.get("health_status")).toBeDefined();
    expect(app.registry.get("server_status")).toBeDefined();
    expect(app.registry.get("source_status")).toBeDefined();
  });
});

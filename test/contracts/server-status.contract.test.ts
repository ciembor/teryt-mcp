import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";

describe("server_status contract", () => {
  it("returns structured runtime status", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "server_status",
        {},
      ),
    ).resolves.toEqual({
      structuredContent: {
        serverName: "teryt-mcp",
        serverVersion: "0.1.0",
        frameworkVersion: "0.1.1",
        transport: "stdio",
        dataDir: "test-data/teryt-mcp",
        database: {
          status: "not_configured",
        },
      },
    });
  });
});

import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

describe("server_status contract", () => {
  it("returns structured runtime status", async () => {
    await expect(
      callTool(
        createApp(createTestRuntimeConfig({
          dataDir: "test-data/teryt-mcp",
        })),
        "server_status",
        {},
      ),
    ).resolves.toEqual({
      structuredContent: {
        serverName: "teryt-mcp",
        serverVersion: "0.1.4",
        frameworkVersion: "0.2.0",
        transport: "stdio",
        dataDir: "test-data/teryt-mcp",
        database: {
          status: "not_configured",
        },
      },
    });
  });
});

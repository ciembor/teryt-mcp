import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";
import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

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
        serverVersion: "0.1.12",
        frameworkVersion: "0.2.1",
        transport: "stdio",
        dataDir: "test-data/teryt-mcp",
        database: {
          status: "missing",
        },
      },
    });
  });

  it("reports an available synchronized database", async () => {
    await expect(callTool(await createSyncedFixtureApp(), "server_status", {})).resolves.toMatchObject({
      structuredContent: {
        database: { status: "available" },
      },
    });
  });
});

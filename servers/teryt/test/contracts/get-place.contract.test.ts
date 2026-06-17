import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

describe("get_place contract", () => {
  it("returns place details with structured content", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_place",
        {
          id: "0009876",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        place: {
          id: "0009876",
          name: "Bolesławiec",
          stateDate: "2026-01-01",
          unitId: "02-01-01-1",
        },
        stateDate: "2026-01-01",
      },
    });
  });

  it("returns null for missing place", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_place",
        {
          id: "missing",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        place: null,
        stateDate: null,
      },
    });
  });
});

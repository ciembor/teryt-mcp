import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";

describe("get_unit contract", () => {
  it("returns unit details with structured content", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_unit",
        {
          id: "02-01-01-1",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: "2026-01-01",
        unit: {
          id: "02-01-01-1",
          name: "Bolesławiec",
          stateDate: "2026-01-01",
          type: "gmina miejska",
        },
      },
    });
  });

  it("returns null for missing unit", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_unit",
        {
          id: "missing",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: null,
        unit: null,
      },
    });
  });
});

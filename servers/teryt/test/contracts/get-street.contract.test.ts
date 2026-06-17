import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

describe("get_street contract", () => {
  it("returns street details with structured content", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_street",
        {
          id: "0009876-0000123",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: "2026-01-01",
        street: {
          code: "0000123",
          id: "0009876-0000123",
          name: "Marszałkowska",
          placeId: "0009876",
          stateDate: "2026-01-01",
        },
      },
    });
  });

  it("returns null for missing street", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "get_street",
        {
          id: "missing",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: null,
        street: null,
      },
    });
  });
});

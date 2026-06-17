import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

describe("search_streets contract", () => {
  it("returns exact normalized name matches with structured content", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "search_streets",
        {
          query: "Marszalkowska",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: "2026-01-01",
        streets: [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            street: {
              code: "0000123",
              id: "0009876-0000123",
              name: "Marszałkowska",
              placeId: "0009876",
              stateDate: "2026-01-01",
            },
          },
        ],
      },
    });
  });

  it("respects limit and exact code ranking", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "search_streets",
        {
          limit: 1,
          query: "0000123",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        streets: [
          {
            confidence: 1,
            matchedBy: "exact_code",
          },
        ],
      },
    });
  });
});

import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

describe("search_units contract", () => {
  it("returns exact normalized name matches with structured content", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "search_units",
        {
          query: "dolnoslaskie",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: "2026-01-01",
        units: [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            unit: {
              id: "02",
              name: "DOLNOŚLĄSKIE",
              stateDate: "2026-01-01",
              type: "województwo",
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
        "search_units",
        {
          limit: 1,
          query: "02",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        units: [
          {
            confidence: 1,
            matchedBy: "exact_code",
          },
        ],
      },
    });
  });
});

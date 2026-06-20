import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("search_units contract", () => {
  it("returns exact normalized name matches with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
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
        await createSyncedFixtureApp(),
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

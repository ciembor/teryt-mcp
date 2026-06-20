import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("search_places contract", () => {
  it("returns exact normalized name matches with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
        "search_places",
        {
          query: "Boleslawiec",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        places: [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            place: {
              id: "0009876",
              name: "Bolesławiec",
              stateDate: "2026-01-01",
              unitId: "02-01-01-1",
            },
          },
        ],
        stateDate: "2026-01-01",
      },
    });
  });

  it("respects limit and exact code ranking", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
        "search_places",
        {
          limit: 1,
          query: "0009876",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        places: [
          {
            confidence: 1,
            matchedBy: "exact_code",
          },
        ],
      },
    });
  });

  it("returns FTS ranking for normalized infix matches", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
        "search_places",
        {
          query: "sław",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        places: [
          {
            confidence: 0.55,
            matchedBy: "fts",
            place: {
              name: "Bolesławiec",
            },
          },
        ],
      },
    });
  });
});

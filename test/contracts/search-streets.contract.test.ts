import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("search_streets contract", () => {
  it("returns exact normalized name matches with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
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
        await createSyncedFixtureApp(),
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

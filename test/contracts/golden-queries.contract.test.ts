import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("golden query contracts", () => {
  it.each([
    ["Kraków", "Kraków"],
    ["Warszawa", "Warszawa"],
    ["Stara Wieś", "Stara Wieś"],
    ["Dąbrowa", "Dąbrowa"],
  ])("finds place %s", async (query, expectedName) => {
    const result = await callTool(await createSyncedFixtureApp(), "search_places", { query });

    expect(result).toMatchObject({
      structuredContent: {
        places: [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            place: {
              name: expectedName,
              stateDate: "2026-01-01",
            },
          },
        ],
        stateDate: "2026-01-01",
      },
    });
  });

  it("finds street Marszałkowska", async () => {
    const result = await callTool(await createSyncedFixtureApp(), "search_streets", { query: "Marszałkowska" });

    expect(result).toMatchObject({
      structuredContent: {
        stateDate: "2026-01-01",
        streets: [
          {
            confidence: 0.95,
            matchedBy: "exact_normalized_name",
            street: {
              name: "Marszałkowska",
              stateDate: "2026-01-01",
            },
          },
        ],
      },
    });
  });
});

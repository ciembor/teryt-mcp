import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("get_unit contract", () => {
  it("returns unit details with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
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
        await createSyncedFixtureApp(),
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

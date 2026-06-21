import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("get_street contract", () => {
  it("returns street details with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
        "get_street",
        {
          id: "0009876-00123",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        stateDate: "2026-01-01",
        street: {
          code: "00123",
          id: "0009876-00123",
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
        await createSyncedFixtureApp(),
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

  it("does not treat a bare SYM_UL code as a unique street identifier", async () => {
    await expect(callTool(await createSyncedFixtureApp(), "get_street", { id: "00123" })).resolves.toEqual({
      structuredContent: {
        stateDate: null,
        street: null,
      },
    });
  });
});

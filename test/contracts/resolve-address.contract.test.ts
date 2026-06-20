import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("resolve_address contract", () => {
  it("returns exact normalized address matches with structured content", async () => {
    await expect(
      callTool(
        await createSyncedFixtureApp(),
        "resolve_address",
        {
          query: "Boleslawiec Marszalkowska",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        addresses: [
          {
            address: {
              id: "0009876-0000123",
              place: {
                id: "0009876",
                name: "Bolesławiec",
              },
              stateDate: "2026-01-01",
              street: {
                code: "0000123",
                id: "0009876-0000123",
                name: "Marszałkowska",
              },
              unit: {
                id: "02-01-01-1",
                name: "Bolesławiec",
                type: "gmina miejska",
              },
            },
            confidence: 0.95,
            matchedBy: "exact_normalized_address",
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
        "resolve_address",
        {
          limit: 1,
          query: "0009876-0000123",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        addresses: [
          {
            confidence: 1,
            matchedBy: "exact_code",
          },
        ],
      },
    });
  });
});

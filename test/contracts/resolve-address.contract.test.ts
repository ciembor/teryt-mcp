import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

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
              id: "0009876-00123",
              place: {
                id: "0009876",
                name: "Bolesławiec",
              },
              stateDate: "2026-01-01",
              street: {
                code: "00123",
                id: "0009876-00123",
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
          query: "0009876-00123",
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

  it.each([
    { query: "Marszalkowska Boleslawiec" },
    { query: "ulica Marszalkowska w Boleslawiec" },
    { query: "ul. Marszalkowskiej w Boleslawcu" },
    { place: "Bolesławiec", street: "Marszałkowska" },
  ])("accepts natural and structured address input: %o", async (input) => {
    await expect(callTool(await createSyncedFixtureApp(), "resolve_address", input)).resolves.toMatchObject({
      structuredContent: {
        addresses: [
          {
            matchedBy: "exact_normalized_address",
          },
        ],
      },
    });
  });

  it("matches an address embedded in a longer query", async () => {
    await expect(
      callTool(await createSyncedFixtureApp(), "resolve_address", {
        query: "prosze sprawdz Boleslawiec Marszalkowska w TERYT",
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        addresses: [
          {
            matchedBy: "contains",
            address: {
              id: "0009876-00123",
            },
          },
        ],
      },
    });
  });

  it("does not reject numeric street names as building numbers", async () => {
    await expect(
      callTool(await createSyncedFixtureApp(), "resolve_address", {
        place: "Bolesławiec",
        street: "1 Armii Wojska Polskiego",
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        addresses: [],
      },
    });
  });

  it.each([
    ["Wieliszew Marszałkowska 5", /building numbers/],
    ["Wieliszew Marszałkowska 10", /building numbers/],
    ["00-001 Wieliszew Marszałkowska", /postal codes/],
    ["00-001, Wieliszew Marszałkowska", /postal codes/],
  ])("rejects unsupported address detail %s", async (query, expectedError) => {
    await expect(callTool(await createSyncedFixtureApp(), "resolve_address", { query })).rejects.toThrow(expectedError);
  });
});

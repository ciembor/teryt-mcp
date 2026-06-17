import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

const appConfig = {
  dataDir: "test-data/teryt-mcp",
  port: 3000,
  transport: "stdio" as const,
};

describe("golden query contracts", () => {
  it.each([
    ["Kraków", "Kraków"],
    ["Warszawa", "Warszawa"],
    ["Stara Wieś", "Stara Wieś"],
    ["Dąbrowa", "Dąbrowa"],
  ])("finds place %s", async (query, expectedName) => {
    const result = await callTool(createApp(appConfig), "search_places", { query });

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
    const result = await callTool(createApp(appConfig), "search_streets", { query: "Marszałkowska" });

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

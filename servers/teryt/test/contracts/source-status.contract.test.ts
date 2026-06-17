import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

describe("source_status contract", () => {
  it("returns official TERYT datasets", async () => {
    await expect(
      callTool(
        createApp({
          dataDir: "test-data/teryt-mcp",
          port: 3000,
          transport: "stdio",
        }),
        "source_status",
        {},
      ),
    ).resolves.toEqual({
      structuredContent: {
        datasets: [
          {
            dataset: {
              code: "TERC",
              name: "Territorial units",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            snapshot: null,
          },
          {
            dataset: {
              code: "SIMC",
              name: "Localities",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            snapshot: null,
          },
          {
            dataset: {
              code: "ULIC",
              name: "Streets",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            snapshot: null,
          },
          {
            dataset: {
              code: "WMRODZ",
              name: "Locality type dictionary",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            snapshot: null,
          },
        ],
      },
    });
  });
});

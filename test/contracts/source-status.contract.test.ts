import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";
import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";
import { createTestSourceCatalog } from "../support/test-source-catalog.js";

afterEach(cleanupSyncedFixtureApps);

describe("source_status contract", () => {
  it("returns official TERYT datasets", async () => {
    await expect(
      callTool(
        createApp(
          createTestRuntimeConfig({ dataDir: "test-data/teryt-mcp" }),
          { sourceCatalog: createTestSourceCatalog() },
        ),
        "source_status",
        {},
      ),
    ).resolves.toEqual({
      structuredContent: {
        datasets: expect.arrayContaining([
          {
            dataset: {
              code: "TERC",
              name: "Territorial units",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            sha256: null,
            snapshot: null,
            stateDate: null,
          },
          {
            dataset: {
              code: "SIMC",
              name: "Localities",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            sha256: null,
            snapshot: null,
            stateDate: null,
          },
          {
            dataset: {
              code: "ULIC",
              name: "Streets",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            sha256: null,
            snapshot: null,
            stateDate: null,
          },
          {
            dataset: {
              code: "WMRODZ",
              name: "Locality type dictionary",
              sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            },
            sha256: null,
            snapshot: null,
            stateDate: null,
          },
        ]),
        lastCheckedAt: "2026-01-01T00:00:00.000Z",
        lastSuccessfulSync: null,
        localDatabase: {
          status: "missing",
        },
        remoteSource: {
          errors: [],
          status: "available",
        },
      },
    });
  });

  it("reports synchronized snapshots and the real SQLite file", async () => {
    const result = await callTool(await createSyncedFixtureApp(), "source_status", {});

    expect(result).toMatchObject({
      structuredContent: {
        lastSuccessfulSync: expect.any(String),
        localDatabase: { status: "available" },
      },
    });
    const datasets = (result.structuredContent as { readonly datasets: readonly unknown[] }).datasets;
    expect(datasets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dataset: expect.objectContaining({ code: "TERC" }),
          snapshot: expect.objectContaining({
            dataset: "TERC",
            recordCount: 7,
            stateDate: "2026-01-01",
          }),
        }),
      ]),
    );
  });

  it("reports official source availability failures without failing the tool", async () => {
    const app = createApp(createTestRuntimeConfig({ dataDir: "test-data/teryt-mcp" }), {
      sourceCatalog: createTestSourceCatalog(503),
    });

    await expect(callTool(app, "source_status", {})).resolves.toMatchObject({
      structuredContent: {
        lastCheckedAt: "2026-01-01T00:00:00.000Z",
        remoteSource: {
          errors: ["eTeryt returned HTTP 503."],
          status: "error",
        },
      },
    });
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";
import { cleanupSyncedFixtureApps, createSyncedFixtureApp } from "../support/synced-fixture-app.js";

afterEach(cleanupSyncedFixtureApps);

describe("about contract", () => {
  it("returns package metadata and missing data status", async () => {
    await expect(
      callTool(
        createApp(createTestRuntimeConfig({
          dataDir: "test-data/teryt-mcp",
        })),
        "about",
        {},
      ),
    ).resolves.toEqual({
      structuredContent: {
        author: {
          name: "Maciej Ciemborowicz",
        },
        contact: {
          email: "maciej.ciemborowicz@gmail.com",
        },
        repository: {
          url: "https://github.com/ciembor/teryt-mcp",
        },
        server: {
          name: "teryt-mcp",
          version: "0.1.11",
        },
        data: {
          datasets: [],
          lastSynchronizedAt: null,
          status: "missing",
          synchronizedSuccessfully: false,
        },
      },
    });
  });

  it("returns successful synchronization metadata and data state dates", async () => {
    await expect(callTool(await createSyncedFixtureApp(), "about", {})).resolves.toMatchObject({
      structuredContent: {
        data: {
          datasets: expect.arrayContaining([
            {
              dataset: "TERC",
              stateDate: "2026-01-01",
              version: "2026-01-01",
            },
          ]) as unknown,
          lastSynchronizedAt: expect.any(String) as string,
          status: "available",
          synchronizedSuccessfully: true,
        },
      },
    });
  });
});

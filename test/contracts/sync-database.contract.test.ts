import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { createFixtureSyncSource } from "../support/fixture-sync-source.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        force: true,
        recursive: true,
      }),
    ),
  );
  tempDirs.length = 0;
});

describe("sync_database contract", () => {
  it("skips missing sync when the database already exists", async () => {
    const dataDir = await createTempDir();
    await createApp(createTestRuntimeConfig({
      dataDir,
    })).registry.get("sync_database");

    await expect(
      callTool(
        createFixtureApp(dataDir),
        "sync_database",
        {
          mode: "force",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        status: "synced",
      },
    });

    await expect(
      callTool(
        createFixtureApp(dataDir),
        "sync_database",
        {
          mode: "missing",
        },
      ),
    ).resolves.toEqual({
      structuredContent: {
        databasePath: null,
        datasets: [],
        mode: "missing",
        status: "skipped",
      },
    });
  });

  it("builds a new database atomically in force mode", async () => {
    const dataDir = await createTempDir();

    await expect(
      callTool(
        createFixtureApp(dataDir),
        "sync_database",
        {
          mode: "force",
        },
      ),
    ).resolves.toMatchObject({
      structuredContent: {
        databasePath: join(dataDir, "teryt.sqlite"),
        datasets: [
          {
            columns: ["WOJ", "POW", "GMI", "RODZ", "NAZWA", "NAZDOD", "STAN_NA"],
            dataset: "TERC",
            publishedAtObserved: null,
            recordCount: 7,
            source: "official-teryt-download",
            sourceUrl: "fixture://TERC.csv",
            stateDate: "2026-01-01",
            variant: "full",
          },
          {
            columns: ["WOJ", "POW", "GMI", "RODZ_GMI", "RM", "MZ", "NAZWA", "SYM", "SYMPOD", "STAN_NA"],
            dataset: "SIMC",
            publishedAtObserved: null,
            recordCount: 5,
            source: "official-teryt-download",
            sourceUrl: "fixture://SIMC.csv",
            stateDate: "2026-01-01",
            variant: "full",
          },
          {
            columns: ["WOJ", "POW", "GMI", "RODZ_GMI", "SYM", "SYM_UL", "CECHA", "NAZWA_1", "NAZWA_2", "STAN_NA"],
            dataset: "ULIC",
            publishedAtObserved: null,
            recordCount: 2,
            source: "official-teryt-download",
            sourceUrl: "fixture://ULIC.csv",
            stateDate: "2026-01-01",
            variant: "full",
          },
          {
            columns: ["RM", "NAZWA_RM", "STAN_NA"],
            dataset: "WMRODZ",
            publishedAtObserved: null,
            recordCount: 2,
            source: "official-teryt-download",
            sourceUrl: "fixture://WMRODZ.csv",
            stateDate: "2026-01-01",
            variant: "full",
          },
        ],
        mode: "force",
        status: "synced",
      },
    });

    await expect(stat(join(dataDir, "teryt.sqlite"))).resolves.toBeDefined();
    await expect(readFile(join(dataDir, "sync-manifest.json"), "utf8")).resolves.toContain('"dataset": "TERC"');
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "teryt-sync-"));
  tempDirs.push(path);
  return path;
}

function createFixtureApp(dataDir: string) {
  return createApp(
    createTestRuntimeConfig({
      dataDir,
    }),
    {
      syncSource: createFixtureSyncSource(),
    },
  );
}

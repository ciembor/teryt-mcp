import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";

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
    await createApp({
      dataDir,
      port: 3000,
      transport: "stdio",
    }).registry.get("sync_database");

    await expect(
      callTool(
        createApp({
          dataDir,
          port: 3000,
          transport: "stdio",
        }),
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
        createApp({
          dataDir,
          port: 3000,
          transport: "stdio",
        }),
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
        createApp({
          dataDir,
          port: 3000,
          transport: "stdio",
        }),
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
            columns: [],
            dataset: "TERC",
            publishedAtObserved: null,
            recordCount: 0,
            source: "official-teryt-download",
            sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            stateDate: "unknown",
            variant: "full",
          },
          {
            columns: [],
            dataset: "SIMC",
            publishedAtObserved: null,
            recordCount: 0,
            source: "official-teryt-download",
            sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            stateDate: "unknown",
            variant: "full",
          },
          {
            columns: [],
            dataset: "ULIC",
            publishedAtObserved: null,
            recordCount: 0,
            source: "official-teryt-download",
            sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            stateDate: "unknown",
            variant: "full",
          },
          {
            columns: [],
            dataset: "WMRODZ",
            publishedAtObserved: null,
            recordCount: 0,
            source: "official-teryt-download",
            sourceUrl: "https://eteryt.stat.gov.pl/eTeryt/",
            stateDate: "unknown",
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

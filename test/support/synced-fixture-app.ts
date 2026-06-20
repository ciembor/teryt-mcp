import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { callTool } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";
import { createFixtureSyncSource } from "./fixture-sync-source.js";

const tempDirs: string[] = [];

export async function createSyncedFixtureApp() {
  const dataDir = await mkdtemp(join(tmpdir(), "teryt-synced-fixture-"));
  tempDirs.push(dataDir);

  const app = createApp(
    {
      dataDir,
      port: 3000,
      transport: "stdio",
    },
    {
      syncSource: createFixtureSyncSource(),
    },
  );

  await callTool(app, "sync_database", {
    mode: "force",
  });

  return app;
}

export async function cleanupSyncedFixtureApps(): Promise<void> {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        force: true,
        recursive: true,
      }),
    ),
  );
  tempDirs.length = 0;
}

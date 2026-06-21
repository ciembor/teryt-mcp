import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { readTerytDatabaseSchemaVersion } from "../../src/features/sync-database/infrastructure/sqlite-query.js";

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

describe("readTerytDatabaseSchemaVersion", () => {
  it("returns null for a corrupt SQLite file", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "teryt-corrupt-sqlite-"));
    tempDirs.push(dataDir);
    await writeFile(join(dataDir, "teryt.sqlite"), "not sqlite");

    await expect(readTerytDatabaseSchemaVersion(dataDir)).resolves.toBeNull();
  });
});

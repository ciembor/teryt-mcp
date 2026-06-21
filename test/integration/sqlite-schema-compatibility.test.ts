import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";

import { withTerytDatabase } from "../../src/features/sync-database/infrastructure/sqlite-query.js";

describe("SQLite schema compatibility", () => {
  it("returns an actionable error for an outdated database", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "teryt-old-schema-"));
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
      db.run("INSERT INTO metadata VALUES ('schemaVersion', '1')");
      await writeFile(join(dataDir, "teryt.sqlite"), db.export());

      await expect(withTerytDatabase(dataDir, () => undefined)).rejects.toThrow(/sync --force/);
    } finally {
      db.close();
      await rm(dataDir, { force: true, recursive: true });
    }
  });
});

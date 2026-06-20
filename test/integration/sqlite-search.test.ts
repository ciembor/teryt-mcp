import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import initSqlJs from "sql.js";
import type { Database, SqlValue } from "sql.js";

import { SqliteDatabaseBuilder } from "../../src/features/sync-database/infrastructure/sqlite-database-builder.js";
import type { SourceFile } from "../../src/features/sync-database/application/ports/teryt-source.js";
import type { DatasetCode } from "../../src/features/sync-database/domain/dataset.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");
const datasets: readonly DatasetCode[] = ["TERC", "SIMC", "ULIC", "WMRODZ"];

describe("SQLite search integration", () => {
  it("builds a searchable SQLite database from TERYT fixtures", async () => {
    const database = await new SqliteDatabaseBuilder().build(await loadFixtureSources());
    const SQL = await initSqlJs();
    const db = new SQL.Database(database.content);

    try {
      expect(queryNames(db, "places", "Stara")).toEqual(["Stara Wieś"]);
      expect(queryNames(db, "streets", "Marszałkowska")).toEqual(["Marszałkowska"]);
    } finally {
      db.close();
    }
  });
});

async function loadFixtureSources(): Promise<readonly SourceFile[]> {
  return Promise.all(
    datasets.map(async (dataset) => ({
      content: await readFile(join(fixtureDir, `${dataset}.csv`)),
      dataset,
      sourceUrl: `fixture://${dataset}.csv`,
      stateDate: "2026-01-01",
    })),
  );
}

function queryNames(db: Database, table: "places" | "streets", query: string) {
  const statement = db.prepare(`SELECT name FROM ${table} WHERE name LIKE ? ORDER BY name`);
  const names: SqlValue[] = [];

  try {
    statement.bind([`%${query}%`]);

    while (statement.step()) {
      names.push(statement.get()[0] ?? "");
    }
  } finally {
    statement.free();
  }

  return names;
}

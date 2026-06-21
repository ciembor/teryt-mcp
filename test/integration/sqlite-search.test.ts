import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { describe, expect, it } from "vitest";

import initSqlJs from "sql.js";
import type { Database, SqlValue } from "sql.js";

import { importTerytSourceFile } from "../../src/features/sync-database/application/importers/teryt-source-file.js";
import { SqliteDatabaseBuilder } from "../../src/features/sync-database/infrastructure/sqlite-database-builder.js";
import type { SourceFile } from "../../src/features/sync-database/application/ports/teryt-source.js";
import type { DatasetCode } from "../../src/features/sync-database/domain/dataset.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");
const datasets: readonly DatasetCode[] = ["TERC", "SIMC", "ULIC", "WMRODZ"];
const decoder = new TextDecoder();
const encoder = new TextEncoder();

describe("SQLite search integration", () => {
  it("builds a searchable SQLite database from TERYT fixtures", async () => {
    const sources = await loadFixtureSources();
    const imports = await Promise.all(sources.map(importTerytSourceFile));
    const database = await new SqliteDatabaseBuilder().build(imports);
    const SQL = await initSqlJs();
    const db = new SQL.Database(database.content);

    try {
      expect(queryNames(db, "places", "Stara")).toEqual(["Stara Wieś"]);
      expect(queryNames(db, "streets", "Marszałkowska")).toEqual(["Marszałkowska"]);
    } finally {
      db.close();
    }
  });

  it("ignores additional CSV columns when inserting fixed raw tables", async () => {
    const sources = await loadFixtureSourcesWithExtraTercColumn();
    const imports = await Promise.all(sources.map(importTerytSourceFile));

    await expect(new SqliteDatabaseBuilder().build(imports)).resolves.toBeDefined();
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

async function loadFixtureSourcesWithExtraTercColumn(): Promise<readonly SourceFile[]> {
  const sources = await loadFixtureSources();

  return sources.map((source) =>
    source.dataset === "TERC"
      ? {
          ...source,
          content: encoder.encode(addCsvColumn(decoder.decode(source.content), "EXTRA", "ignored")),
        }
      : source,
  );
}

function addCsvColumn(csv: string, column: string, value: string): string {
  return csv
    .split("\n")
    .map((line, index) => appendCsvValue(line, index === 0 ? column : value))
    .join("\n");
}

function appendCsvValue(line: string, value: string): string {
  return line ? `${line};${value}` : line;
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

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { TerytSource } from "../../src/features/sync-database/application/ports/teryt-source.js";

const fixtureDir = join(process.cwd(), "test", "fixtures", "teryt");

export function createFixtureSyncSource(): TerytSource {
  return {
    download: async (dataset) => ({
      content: await readFile(join(fixtureDir, `${dataset}.csv`)),
      dataset,
      sourceUrl: `fixture://${dataset}.csv`,
      stateDate: "2026-01-01",
    }),
  };
}

import { createHash } from "node:crypto";

import { datasetCodes } from "../domain/dataset.js";
import type { DatabaseSnapshot, DatasetSnapshot } from "../domain/snapshot.js";
import type { SyncMode } from "../domain/sync-plan.js";
import { planSync } from "./plan-sync.js";
import type { DatabaseBuilder } from "./ports/database-builder.js";
import type { FileStore } from "./ports/file-store.js";
import type { LockStore } from "./ports/lock-store.js";
import type { SyncManifestStore } from "./ports/manifest-store.js";
import type { TerytSource } from "./ports/teryt-source.js";

export type SyncDatabaseInput = {
  readonly databaseBuilder: DatabaseBuilder;
  readonly fileStore: FileStore;
  readonly lockStore: LockStore;
  readonly manifestStore: SyncManifestStore;
  readonly mode: SyncMode;
  readonly now: () => Date;
  readonly source: TerytSource;
};

type SyncDatabaseResult = {
  readonly databasePath: string | null;
  readonly datasets: readonly DatasetSnapshot[];
  readonly mode: SyncMode;
  readonly status: "skipped" | "synced";
};

export async function syncDatabase(input: SyncDatabaseInput): Promise<SyncDatabaseResult> {
  return input.lockStore.withSyncLock(async () => {
    const plan = await planSync({
      fileStore: input.fileStore,
      mode: input.mode,
    });

    if (plan.action === "skip_existing") {
      return {
        databasePath: null,
        datasets: [],
        mode: input.mode,
        status: "skipped",
      };
    }

    const sourceFiles = await Promise.all(datasetCodes.map((dataset) => input.source.download(dataset)));
    const database = await input.databaseBuilder.build(sourceFiles);
    const databasePath = await input.fileStore.swapDatabase(database.content);
    const datasets = sourceFiles.map((sourceFile) => ({
      columns: [],
      dataset: sourceFile.dataset,
      downloadedAt: input.now().toISOString(),
      publishedAtObserved: null,
      recordCount: 0,
      sha256: sha256(sourceFile.content),
      source: "official-teryt-download",
      sourceUrl: sourceFile.sourceUrl,
      stateDate: sourceFile.stateDate,
      variant: "full" as const,
    }));
    const snapshot: DatabaseSnapshot = {
      builtAt: input.now().toISOString(),
      datasets,
      path: databasePath,
    };

    await input.manifestStore.writeSnapshot(snapshot);

    return {
      databasePath,
      datasets,
      mode: input.mode,
      status: "synced",
    };
  });
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

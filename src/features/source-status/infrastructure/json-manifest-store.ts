import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { DatasetCode } from "../domain/dataset.js";
import type { SourceSnapshot } from "../domain/source-snapshot.js";
import type { ManifestStore } from "../application/ports/manifest-store.js";
import type { DatabaseSnapshot } from "../../sync-database/domain/snapshot.js";
import { terytDatabaseSchemaVersion } from "../../sync-database/domain/database-schema.js";
import { readTerytDatabaseSchemaVersion } from "../../sync-database/infrastructure/sqlite-query.js";

type ManifestFile = {
  readonly builtAt?: string;
  readonly datasets?: readonly SourceSnapshot[];
  readonly path?: string;
  readonly schemaVersion?: number;
};

export class JsonManifestStore implements ManifestStore {
  constructor(private readonly dataDir: string) {}

  async getSnapshot(dataset: DatasetCode): Promise<SourceSnapshot | undefined> {
    const manifest = await this.readCompatibleManifest();
    return manifest?.datasets?.find((snapshot) => snapshot.dataset === dataset);
  }

  async getDatabaseSnapshot(): Promise<DatabaseSnapshot | undefined> {
    const manifest = await this.readCompatibleManifest();

    if (!manifest?.builtAt || !manifest.path || !manifest.datasets) {
      return undefined;
    }

    return {
      builtAt: manifest.builtAt,
      datasets: manifest.datasets.map((dataset) => ({
        columns: [],
        dataset: dataset.dataset,
        downloadedAt: dataset.downloadedAt,
        publishedAtObserved: null,
        recordCount: dataset.recordCount ?? 0,
        sha256: dataset.sha256 ?? "",
        source: "official-teryt-download",
        sourceUrl: dataset.sourceUrl,
        stateDate: dataset.stateDate ?? "unknown",
        variant: "full",
      })),
      path: manifest.path,
      schemaVersion: terytDatabaseSchemaVersion,
    };
  }

  async hasDatabase(): Promise<boolean> {
    try {
      await access(join(this.dataDir, "teryt.sqlite"));
      const [manifest, databaseSchemaVersion] = await Promise.all([
        this.readCompatibleManifest(),
        readTerytDatabaseSchemaVersion(this.dataDir),
      ]);

      return Boolean(
        manifest &&
          databaseSchemaVersion === terytDatabaseSchemaVersion &&
          manifest.path &&
          resolve(manifest.path) === resolve(this.dataDir, "teryt.sqlite"),
      );
    } catch (error) {
      if (isMissingFile(error)) {
        return false;
      }

      throw error;
    }
  }

  private async readCompatibleManifest(): Promise<ManifestFile | undefined> {
    try {
      const content = await readFile(join(this.dataDir, "sync-manifest.json"), "utf8");
      const manifest = JSON.parse(content) as ManifestFile;
      return manifest.schemaVersion === terytDatabaseSchemaVersion ? manifest : undefined;
    } catch (error) {
      if (isMissingFile(error) || error instanceof SyntaxError) {
        return undefined;
      }

      throw error;
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

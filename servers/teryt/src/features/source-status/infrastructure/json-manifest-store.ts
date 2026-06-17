import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { DatasetCode } from "../domain/dataset.js";
import type { SourceSnapshot } from "../domain/source-snapshot.js";
import type { ManifestStore } from "../application/ports/manifest-store.js";

type ManifestFile = {
  readonly snapshots?: readonly SourceSnapshot[];
};

export class JsonManifestStore implements ManifestStore {
  constructor(private readonly dataDir: string) {}

  async getSnapshot(dataset: DatasetCode): Promise<SourceSnapshot | undefined> {
    try {
      const content = await readFile(join(this.dataDir, "source-manifest.json"), "utf8");
      const manifest = JSON.parse(content) as ManifestFile;

      return manifest.snapshots?.find((snapshot) => snapshot.dataset === dataset);
    } catch (error) {
      if (isMissingFile(error)) {
        return undefined;
      }

      throw error;
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

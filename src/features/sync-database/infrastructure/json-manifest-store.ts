import { join } from "node:path";

import { atomicWrite } from "@mcp-craftsman/node";

import type { SyncManifestStore } from "../application/ports/manifest-store.js";
import type { DatabaseSnapshot } from "../domain/snapshot.js";

export class JsonSyncManifestStore implements SyncManifestStore {
  constructor(private readonly dataDir: string) {}

  async writeSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
    await atomicWrite(join(this.dataDir, "sync-manifest.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  }
}

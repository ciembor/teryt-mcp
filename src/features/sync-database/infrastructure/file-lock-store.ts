import { join } from "node:path";

import { withLock } from "@mcp-craftsman/node";

import type { LockStore } from "../application/ports/lock-store.js";

export class FileLockStore implements LockStore {
  constructor(private readonly dataDir: string) {}

  async withSyncLock<T>(callback: () => Promise<T>): Promise<T> {
    return withLock(join(this.dataDir, "sync.lock"), callback);
  }
}

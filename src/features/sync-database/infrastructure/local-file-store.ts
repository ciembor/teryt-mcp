import { access } from "node:fs/promises";
import { join } from "node:path";

import { atomicWrite } from "@mcp-craftsman/node";

import type { FileStore } from "../application/ports/file-store.js";

export class LocalFileStore implements FileStore {
  constructor(private readonly dataDir: string) {}

  async databaseExists(): Promise<boolean> {
    try {
      await access(this.databasePath);
      return true;
    } catch {
      return false;
    }
  }

  async swapDatabase(content: Uint8Array): Promise<string> {
    await atomicWrite(this.databasePath, content);
    return this.databasePath;
  }

  private get databasePath(): string {
    return join(this.dataDir, "teryt.sqlite");
  }
}

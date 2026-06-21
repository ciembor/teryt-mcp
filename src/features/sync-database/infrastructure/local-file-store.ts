import { access, stat } from "node:fs/promises";
import { join } from "node:path";

import { atomicWrite } from "@mcp-craftsman/node";

import type { FileStore } from "../application/ports/file-store.js";
import { readTerytDatabaseSchemaVersion } from "./sqlite-query.js";

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

  async databaseSchemaVersion(): Promise<number | null> {
    return readTerytDatabaseSchemaVersion(this.dataDir);
  }

  async databaseModifiedAt(): Promise<Date | null> {
    try {
      return (await stat(this.databasePath)).mtime;
    } catch {
      return null;
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

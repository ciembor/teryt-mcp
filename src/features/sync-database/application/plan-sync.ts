import type { SyncMode, SyncPlan } from "../domain/sync-plan.js";
import type { FileStore } from "./ports/file-store.js";
import { terytDatabaseSchemaVersion } from "../domain/database-schema.js";

type PlanSyncInput = {
  readonly databaseIsUsable: () => Promise<boolean>;
  readonly fileStore: FileStore;
  readonly mode: SyncMode;
  readonly now: Date;
};

const databaseStaleAfterMs = 24 * 60 * 60 * 1000;

export async function planSync(input: PlanSyncInput): Promise<SyncPlan> {
  const databaseExists = await input.fileStore.databaseExists();

  if (databaseExists) {
    const schemaVersion = await input.fileStore.databaseSchemaVersion();

    if (schemaVersion !== terytDatabaseSchemaVersion) {
      return {
        action: "build_database",
        reason: "incompatible_schema",
      };
    }

    const databaseIsUsable = await input.databaseIsUsable();

    if (!databaseIsUsable) {
      return {
        action: "build_database",
        reason: input.mode,
      };
    }

    if (input.mode === "missing") {
      return {
        action: "skip_existing",
        reason: "database_exists",
      };
    }

    if (input.mode === "stale") {
      const modifiedAt = await input.fileStore.databaseModifiedAt();

      if (modifiedAt && input.now.getTime() - modifiedAt.getTime() < databaseStaleAfterMs) {
        return {
          action: "skip_existing",
          reason: "database_fresh",
        };
      }
    }
  }

  return {
    action: "build_database",
    reason: input.mode,
  };
}

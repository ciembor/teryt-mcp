import type { SyncMode, SyncPlan } from "../domain/sync-plan.js";
import type { FileStore } from "./ports/file-store.js";

type PlanSyncInput = {
  readonly fileStore: FileStore;
  readonly mode: SyncMode;
};

export async function planSync(input: PlanSyncInput): Promise<SyncPlan> {
  const databaseExists = await input.fileStore.databaseExists();

  if (input.mode === "missing" && databaseExists) {
    return {
      action: "skip_existing",
      reason: "database_exists",
    };
  }

  return {
    action: "build_database",
    reason: input.mode,
  };
}

export type SyncMode = "missing" | "stale" | "force";

export type SyncPlanAction = "skip_existing" | "build_database";

export type SyncPlan = {
  readonly action: SyncPlanAction;
  readonly reason: string;
};

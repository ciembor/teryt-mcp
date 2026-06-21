import type { DatasetCode } from "../../domain/dataset.js";
import type { SourceSnapshot } from "../../domain/source-snapshot.js";
import type { DatabaseSnapshot } from "../../../sync-database/domain/snapshot.js";

export type ManifestStore = {
  readonly getDatabaseSnapshot: () => Promise<DatabaseSnapshot | undefined>;
  readonly getSnapshot: (dataset: DatasetCode) => Promise<SourceSnapshot | undefined>;
  readonly hasDatabase: () => Promise<boolean>;
};

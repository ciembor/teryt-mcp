import type { DatasetCode } from "../../domain/dataset.js";
import type { SourceSnapshot } from "../../domain/source-snapshot.js";

export type ManifestStore = {
  readonly getSnapshot: (dataset: DatasetCode) => Promise<SourceSnapshot | undefined>;
};

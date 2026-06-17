import type { DatasetCode } from "./dataset.js";

export type SourceSnapshot = {
  readonly dataset: DatasetCode;
  readonly downloadedAt: string;
  readonly recordCount?: number;
  readonly sha256?: string;
  readonly sourceUrl: string;
  readonly stateDate?: string;
  readonly version?: string;
};

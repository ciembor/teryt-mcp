import type { DatasetCode } from "./dataset.js";

export type SourceSnapshot = {
  readonly dataset: DatasetCode;
  readonly version: string;
  readonly downloadedAt: string;
  readonly sourceUrl: string;
};

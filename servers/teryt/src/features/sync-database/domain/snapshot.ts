import type { DatasetCode } from "./dataset.js";

export type DatasetSnapshot = {
  readonly dataset: DatasetCode;
  readonly downloadedAt: string;
  readonly sha256: string;
  readonly sourceUrl: string;
  readonly stateDate: string;
};

export type DatabaseSnapshot = {
  readonly builtAt: string;
  readonly datasets: readonly DatasetSnapshot[];
  readonly path: string;
};

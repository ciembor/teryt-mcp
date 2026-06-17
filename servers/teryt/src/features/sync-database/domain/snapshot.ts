import type { DatasetCode } from "./dataset.js";

export type DatasetSnapshot = {
  readonly columns: readonly string[];
  readonly dataset: DatasetCode;
  readonly downloadedAt: string;
  readonly publishedAtObserved: string | null;
  readonly recordCount: number;
  readonly sha256: string;
  readonly source: string;
  readonly sourceUrl: string;
  readonly stateDate: string;
  readonly variant: "full";
};

export type DatabaseSnapshot = {
  readonly builtAt: string;
  readonly datasets: readonly DatasetSnapshot[];
  readonly path: string;
};

import type { DatasetCode } from "../../domain/dataset.js";

export type SourceFile = {
  readonly dataset: DatasetCode;
  readonly content: Uint8Array;
  readonly sourceUrl: string;
  readonly stateDate: string;
};

export type TerytSource = {
  readonly download: (dataset: DatasetCode) => Promise<SourceFile>;
};

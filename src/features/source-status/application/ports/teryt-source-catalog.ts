import type { Dataset } from "../../domain/dataset.js";

export type TerytSourceCatalog = {
  readonly checkAvailability: () => Promise<{
    readonly checkedAt: string;
    readonly errors: readonly string[];
    readonly status: "available" | "error";
  }>;
  readonly listDatasets: () => Promise<readonly Dataset[]>;
};

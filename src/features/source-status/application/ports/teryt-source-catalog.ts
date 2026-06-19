import type { Dataset } from "../../domain/dataset.js";

export type TerytSourceCatalog = {
  readonly listDatasets: () => Promise<readonly Dataset[]>;
};

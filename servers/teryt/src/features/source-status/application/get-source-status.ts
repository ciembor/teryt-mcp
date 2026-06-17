import type { Dataset } from "../domain/dataset.js";
import type { SourceSnapshot } from "../domain/source-snapshot.js";
import type { ManifestStore } from "./ports/manifest-store.js";
import type { TerytSourceCatalog } from "./ports/teryt-source-catalog.js";

type SourceStatusItem = {
  readonly dataset: Dataset;
  readonly snapshot: SourceSnapshot | null;
};

type SourceStatus = {
  readonly datasets: readonly SourceStatusItem[];
};

export type GetSourceStatusInput = {
  readonly manifestStore: ManifestStore;
  readonly sourceCatalog: TerytSourceCatalog;
};

export async function getSourceStatus(input: GetSourceStatusInput): Promise<SourceStatus> {
  const datasets = await input.sourceCatalog.listDatasets();
  const snapshots = await Promise.all(
    datasets.map(async (dataset) => ({
      dataset,
      snapshot: (await input.manifestStore.getSnapshot(dataset.code)) ?? null,
    })),
  );

  return {
    datasets: snapshots,
  };
}

import type { Dataset } from "../domain/dataset.js";
import type { SourceSnapshot } from "../domain/source-snapshot.js";
import type { ManifestStore } from "./ports/manifest-store.js";
import type { TerytSourceCatalog } from "./ports/teryt-source-catalog.js";

type SourceStatusItem = {
  readonly dataset: Dataset;
  readonly sha256: string | null;
  readonly snapshot: SourceSnapshot | null;
  readonly stateDate: string | null;
};

type SourceStatus = {
  readonly datasets: readonly SourceStatusItem[];
  readonly lastCheckedAt: string | null;
  readonly lastSuccessfulSync: string | null;
  readonly localDatabase: {
    readonly status: "missing" | "available";
  };
  readonly remoteSource: {
    readonly errors: readonly string[];
    readonly status: "unknown" | "available" | "error";
  };
};

export type GetSourceStatusInput = {
  readonly manifestStore: ManifestStore;
  readonly sourceCatalog: TerytSourceCatalog;
};

export async function getSourceStatus(input: GetSourceStatusInput): Promise<SourceStatus> {
  const datasets = await input.sourceCatalog.listDatasets();
  const snapshots = await Promise.all(
    datasets.map(async (dataset) => {
      const snapshot = (await input.manifestStore.getSnapshot(dataset.code)) ?? null;

      return {
        dataset,
        snapshot,
        sha256: snapshot?.sha256 ?? null,
        stateDate: snapshot?.stateDate ?? null,
      };
    }),
  );
  const lastSuccessfulSync = snapshots
    .map((item) => item.snapshot?.downloadedAt)
    .filter((downloadedAt): downloadedAt is string => Boolean(downloadedAt))
    .sort()
    .at(-1) ?? null;

  return {
    lastCheckedAt: null,
    localDatabase: {
      status: snapshots.some((item) => item.snapshot) ? "available" : "missing",
    },
    remoteSource: {
      errors: [],
      status: "unknown",
    },
    datasets: snapshots,
    lastSuccessfulSync,
  };
}

import type { DatabaseSnapshot } from "../../sync-database/domain/snapshot.js";
import type { ManifestStore } from "../../source-status/index.js";

type About = {
  readonly author: {
    readonly name: string;
  };
  readonly contact: {
    readonly email: string;
  };
  readonly repository: {
    readonly url: string;
  };
  readonly server: {
    readonly name: string;
    readonly version: string;
  };
  readonly data: {
    readonly datasets: readonly DataVersion[];
    readonly lastSynchronizedAt: string | null;
    readonly status: "missing" | "available";
    readonly synchronizedSuccessfully: boolean;
  };
};

type DataVersion = {
  readonly dataset: string;
  readonly stateDate: string;
  readonly version: string;
};

export type GetAboutInput = {
  readonly authorEmail: string;
  readonly authorName: string;
  readonly manifestStore: ManifestStore;
  readonly repositoryUrl: string;
  readonly serverName: string;
  readonly serverVersion: string;
};

export async function getAbout(input: GetAboutInput): Promise<About> {
  const [hasDatabase, snapshot] = await Promise.all([
    input.manifestStore.hasDatabase(),
    input.manifestStore.getDatabaseSnapshot(),
  ]);

  return {
    author: {
      name: input.authorName,
    },
    contact: {
      email: input.authorEmail,
    },
    repository: {
      url: input.repositoryUrl,
    },
    server: {
      name: input.serverName,
      version: input.serverVersion,
    },
    data: {
      datasets: readDataVersions(snapshot),
      lastSynchronizedAt: hasDatabase ? snapshot?.builtAt ?? null : null,
      status: hasDatabase ? "available" : "missing",
      synchronizedSuccessfully: hasDatabase,
    },
  };
}

function readDataVersions(snapshot: DatabaseSnapshot | undefined): readonly DataVersion[] {
  return (
    snapshot?.datasets.map((dataset) => ({
      dataset: dataset.dataset,
      stateDate: dataset.stateDate,
      version: dataset.stateDate,
    })) ?? []
  );
}

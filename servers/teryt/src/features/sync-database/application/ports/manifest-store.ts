import type { DatabaseSnapshot } from "../../domain/snapshot.js";

export type SyncManifestStore = {
  readonly writeSnapshot: (snapshot: DatabaseSnapshot) => Promise<void>;
};

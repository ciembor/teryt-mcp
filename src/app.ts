import { createMcpApp } from "@mcp-craftsman/core";
import type { RuntimeConfig } from "@mcp-craftsman/node";

import { EterytSourceCatalog } from "./features/source-status/infrastructure/eteryt-source-catalog.js";
import { JsonManifestStore } from "./features/source-status/infrastructure/json-manifest-store.js";
import { EterytSource } from "./features/sync-database/infrastructure/eteryt-source.js";
import { FileLockStore } from "./features/sync-database/infrastructure/file-lock-store.js";
import { JsonSyncManifestStore } from "./features/sync-database/infrastructure/json-manifest-store.js";
import { LocalFileStore } from "./features/sync-database/infrastructure/local-file-store.js";
import { SqliteDatabaseBuilder } from "./features/sync-database/infrastructure/sqlite-database-builder.js";
import { SqliteTerytRepository } from "./features/sync-database/infrastructure/sqlite-teryt-repository.js";
import type { TerytSource } from "./features/sync-database/application/ports/teryt-source.js";
import { createRegistry } from "./mcp/registry.js";
import { loadTerytRuntimeConfig } from "./runtime/config.js";
import { terytMcpVersion } from "./version.js";

type CreateAppOverrides = {
  readonly sourceCatalog?: EterytSourceCatalog;
  readonly syncSource?: TerytSource;
};

export function createApp(config: RuntimeConfig = loadTerytRuntimeConfig(), overrides: CreateAppOverrides = {}) {
  const sourceCatalog = overrides.sourceCatalog ?? new EterytSourceCatalog();
  const manifestStore = new JsonManifestStore(config.dataDir);
  const syncFileStore = new LocalFileStore(config.dataDir);
  const syncLockStore = new FileLockStore(config.dataDir);
  const syncManifestStore = new JsonSyncManifestStore(config.dataDir);
  const syncSource = overrides.syncSource ?? new EterytSource();
  const terytRepository = new SqliteTerytRepository(config.dataDir);

  return createMcpApp({
    name: "teryt-mcp",
    version: terytMcpVersion,
    registry: createRegistry({
      config,
      manifestStore,
      sourceCatalog,
      addressRepository: terytRepository,
      placeDetailsRepository: terytRepository,
      placeRepository: terytRepository,
      streetDetailsRepository: terytRepository,
      streetRepository: terytRepository,
      unitDetailsRepository: terytRepository,
      unitRepository: terytRepository,
      sync: {
        databaseBuilder: new SqliteDatabaseBuilder(),
        databaseIsUsable: () => manifestStore.hasDatabase(),
        fileStore: syncFileStore,
        lockStore: syncLockStore,
        manifestStore: syncManifestStore,
        now: () => new Date(),
        source: syncSource,
      },
    }),
  });
}

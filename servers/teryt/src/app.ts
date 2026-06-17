import { createMcpApp } from "@mcp-kit/core";
import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-kit/node";

import { InMemoryPlaceRepository } from "./features/search-places/infrastructure/in-memory-place-repository.js";
import { InMemoryStreetRepository } from "./features/search-streets/infrastructure/in-memory-street-repository.js";
import { InMemoryUnitRepository } from "./features/search-units/infrastructure/in-memory-unit-repository.js";
import { EterytSourceCatalog } from "./features/source-status/infrastructure/eteryt-source-catalog.js";
import { JsonManifestStore } from "./features/source-status/infrastructure/json-manifest-store.js";
import { EterytSource } from "./features/sync-database/infrastructure/eteryt-source.js";
import { FileLockStore } from "./features/sync-database/infrastructure/file-lock-store.js";
import { JsonSyncManifestStore } from "./features/sync-database/infrastructure/json-manifest-store.js";
import { LocalFileStore } from "./features/sync-database/infrastructure/local-file-store.js";
import { SqliteDatabaseBuilder } from "./features/sync-database/infrastructure/sqlite-database-builder.js";
import { createRegistry } from "./mcp/registry.js";

export function createApp(config: RuntimeConfig = loadRuntimeConfig()) {
  const sourceCatalog = new EterytSourceCatalog();
  const manifestStore = new JsonManifestStore(config.dataDir);
  const syncFileStore = new LocalFileStore(config.dataDir);
  const syncLockStore = new FileLockStore(config.dataDir);
  const syncManifestStore = new JsonSyncManifestStore(config.dataDir);
  const syncSource = new EterytSource();

  return createMcpApp({
    name: "teryt-mcp",
    version: "0.0.0",
    registry: createRegistry({
      config,
      manifestStore,
      placeRepository: new InMemoryPlaceRepository(),
      sourceCatalog,
      streetRepository: new InMemoryStreetRepository(),
      unitRepository: new InMemoryUnitRepository(),
      sync: {
        databaseBuilder: new SqliteDatabaseBuilder(),
        fileStore: syncFileStore,
        lockStore: syncLockStore,
        manifestStore: syncManifestStore,
        now: () => new Date(),
        source: syncSource,
      },
    }),
  });
}

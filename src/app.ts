import { createMcpApp } from "@mcp-craftman/core";
import { loadRuntimeConfig, type RuntimeConfig } from "@mcp-craftman/node";

import { InMemoryPlaceDetailsRepository } from "./features/get-place/infrastructure/in-memory-place-details-repository.js";
import { InMemoryStreetDetailsRepository } from "./features/get-street/infrastructure/in-memory-street-details-repository.js";
import { InMemoryUnitDetailsRepository } from "./features/get-unit/infrastructure/in-memory-unit-details-repository.js";
import { InMemoryAddressRepository } from "./features/resolve-address/infrastructure/in-memory-address-repository.js";
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
import type { TerytSource } from "./features/sync-database/application/ports/teryt-source.js";
import { createRegistry } from "./mcp/registry.js";
import { terytMcpVersion } from "./version.js";

type CreateAppOverrides = {
  readonly syncSource?: TerytSource;
};

export function createApp(config: RuntimeConfig = loadRuntimeConfig(), overrides: CreateAppOverrides = {}) {
  const sourceCatalog = new EterytSourceCatalog();
  const manifestStore = new JsonManifestStore(config.dataDir);
  const syncFileStore = new LocalFileStore(config.dataDir);
  const syncLockStore = new FileLockStore(config.dataDir);
  const syncManifestStore = new JsonSyncManifestStore(config.dataDir);
  const syncSource = overrides.syncSource ?? new EterytSource();

  return createMcpApp({
    name: "teryt-mcp",
    version: terytMcpVersion,
    registry: createRegistry({
      config,
      manifestStore,
      sourceCatalog,
      addressRepository: new InMemoryAddressRepository(),
      placeDetailsRepository: new InMemoryPlaceDetailsRepository(),
      placeRepository: new InMemoryPlaceRepository(),
      streetDetailsRepository: new InMemoryStreetDetailsRepository(),
      streetRepository: new InMemoryStreetRepository(),
      unitDetailsRepository: new InMemoryUnitDetailsRepository(),
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

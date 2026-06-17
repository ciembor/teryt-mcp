import { createCapabilityRegistry } from "@mcp-kit/core";
import type { RuntimeConfig } from "@mcp-kit/node";

import { healthTool } from "../features/health/index.js";
import { createSearchPlacesTool, type PlaceRepository } from "../features/search-places/index.js";
import { createSearchUnitsTool, type UnitRepository } from "../features/search-units/index.js";
import { createServerStatusTool } from "../features/server-status/index.js";
import { createSourceStatusTool, type ManifestStore, type TerytSourceCatalog } from "../features/source-status/index.js";
import {
  createSyncDatabaseTool,
  type DatabaseBuilder,
  type FileStore,
  type LockStore,
  type SyncManifestStore,
  type TerytSource,
} from "../features/sync-database/index.js";

type CreateRegistryInput = {
  readonly config: RuntimeConfig;
  readonly manifestStore: ManifestStore;
  readonly placeRepository: PlaceRepository;
  readonly sourceCatalog: TerytSourceCatalog;
  readonly unitRepository: UnitRepository;
  readonly sync: {
    readonly databaseBuilder: DatabaseBuilder;
    readonly fileStore: FileStore;
    readonly lockStore: LockStore;
    readonly manifestStore: SyncManifestStore;
    readonly now: () => Date;
    readonly source: TerytSource;
  };
};

export function createRegistry(input: CreateRegistryInput) {
  return createCapabilityRegistry([
    healthTool,
    createServerStatusTool({
      dataDir: input.config.dataDir,
      transport: input.config.transport,
    }),
    createSourceStatusTool({
      manifestStore: input.manifestStore,
      sourceCatalog: input.sourceCatalog,
    }),
    createSearchPlacesTool({
      placeRepository: input.placeRepository,
    }),
    createSearchUnitsTool({
      unitRepository: input.unitRepository,
    }),
    createSyncDatabaseTool(input.sync),
  ]);
}

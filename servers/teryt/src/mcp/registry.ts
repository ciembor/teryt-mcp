import { createCapabilityRegistry } from "@mcp-kit/core";
import type { RuntimeConfig } from "@mcp-kit/node";

import { createGetPlaceTool, type PlaceDetailsRepository } from "../features/get-place/index.js";
import { createGetUnitTool, type UnitDetailsRepository } from "../features/get-unit/index.js";
import { healthTool } from "../features/health/index.js";
import { createResolveAddressTool, type AddressRepository } from "../features/resolve-address/index.js";
import { createSearchPlacesTool, type PlaceRepository } from "../features/search-places/index.js";
import { createSearchStreetsTool, type StreetRepository } from "../features/search-streets/index.js";
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
  readonly addressRepository: AddressRepository;
  readonly config: RuntimeConfig;
  readonly manifestStore: ManifestStore;
  readonly placeDetailsRepository: PlaceDetailsRepository;
  readonly unitDetailsRepository: UnitDetailsRepository;
  readonly placeRepository: PlaceRepository;
  readonly sourceCatalog: TerytSourceCatalog;
  readonly streetRepository: StreetRepository;
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
    createGetPlaceTool({
      placeDetailsRepository: input.placeDetailsRepository,
    }),
    createGetUnitTool({
      unitDetailsRepository: input.unitDetailsRepository,
    }),
    createResolveAddressTool({
      addressRepository: input.addressRepository,
    }),
    createSearchPlacesTool({
      placeRepository: input.placeRepository,
    }),
    createSearchStreetsTool({
      streetRepository: input.streetRepository,
    }),
    createSearchUnitsTool({
      unitRepository: input.unitRepository,
    }),
    createSyncDatabaseTool(input.sync),
  ]);
}

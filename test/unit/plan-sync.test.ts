import { describe, expect, it } from "vitest";

import { planSync } from "../../src/features/sync-database/application/plan-sync.js";

describe("planSync", () => {
  it("rebuilds in force mode without reading existing database metadata", async () => {
    const fileStore = {
      databaseExists: async () => {
        throw new Error("databaseExists should not be called");
      },
      databaseModifiedAt: async () => {
        throw new Error("databaseModifiedAt should not be called");
      },
      databaseSchemaVersion: async () => {
        throw new Error("databaseSchemaVersion should not be called");
      },
      swapDatabase: async () => "unused",
    };

    await expect(
      planSync({
        databaseIsUsable: async () => {
          throw new Error("databaseIsUsable should not be called");
        },
        fileStore,
        mode: "force",
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "build_database", reason: "force" });
  });

  it("skips an existing compatible database in missing mode", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => true,
        fileStore: createFileStore(2),
        mode: "missing",
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "skip_existing", reason: "database_exists" });
  });

  it("rebuilds an existing database with an incompatible schema in missing mode", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => true,
        fileStore: createFileStore(null),
        mode: "missing",
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "build_database", reason: "incompatible_schema" });
  });

  it("rebuilds in missing mode when a compatible database exists but is not usable", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => false,
        fileStore: createFileStore(2),
        mode: "missing",
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "build_database", reason: "missing" });
  });

  it("rebuilds when a compatible database exists but is not usable", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => false,
        fileStore: createFileStore(2, new Date("2026-01-01T12:00:00.000Z")),
        mode: "stale",
        now: new Date("2026-01-02T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "build_database", reason: "stale" });
  });

  it("skips a compatible usable database newer than 24 hours in stale mode", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => true,
        fileStore: createFileStore(2, new Date("2026-01-01T12:00:00.000Z")),
        mode: "stale",
        now: new Date("2026-01-02T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "skip_existing", reason: "database_fresh" });
  });

  it("rebuilds a compatible database at least 24 hours old in stale mode", async () => {
    await expect(
      planSync({
        databaseIsUsable: async () => true,
        fileStore: createFileStore(2, new Date("2026-01-01T00:00:00.000Z")),
        mode: "stale",
        now: new Date("2026-01-02T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ action: "build_database", reason: "stale" });
  });
});

function createFileStore(schemaVersion: number | null, modifiedAt = new Date("2026-01-01T00:00:00.000Z")) {
  return {
    databaseExists: async () => true,
    databaseModifiedAt: async () => modifiedAt,
    databaseSchemaVersion: async () => schemaVersion,
    swapDatabase: async () => "unused",
  };
}

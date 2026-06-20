import type { PlaceDetailsRepository } from "../../get-place/application/ports/place-details-repository.js";
import type { PlaceDetails } from "../../get-place/domain/place-details.js";
import type { StreetDetailsRepository } from "../../get-street/application/ports/street-details-repository.js";
import type { StreetDetails } from "../../get-street/domain/street-details.js";
import type { UnitDetailsRepository } from "../../get-unit/application/ports/unit-details-repository.js";
import type { UnitDetails } from "../../get-unit/domain/unit-details.js";
import type { AddressRepository } from "../../resolve-address/application/ports/address-repository.js";
import type { ResolvedAddress } from "../../resolve-address/domain/address.js";
import type { PlaceRepository } from "../../search-places/application/ports/place-repository.js";
import type { Place } from "../../search-places/domain/place.js";
import type { StreetRepository } from "../../search-streets/application/ports/street-repository.js";
import type { Street } from "../../search-streets/domain/street.js";
import type { UnitRepository } from "../../search-units/application/ports/unit-repository.js";
import type { Unit } from "../../search-units/domain/unit.js";
import { queryMany, queryOne, type SqlRow, withTerytDatabase } from "./sqlite-query.js";

export class SqliteTerytRepository
  implements
    AddressRepository,
    PlaceDetailsRepository,
    PlaceRepository,
    StreetDetailsRepository,
    StreetRepository,
    UnitDetailsRepository,
    UnitRepository
{
  constructor(private readonly dataDir: string) {}

  async getPlace(id: string): Promise<PlaceDetails | null> {
    return withTerytDatabase(this.dataDir, (db) => queryOne(db, "SELECT id, name, stateDate, unitId FROM places WHERE id = ?", [id], mapPlace));
  }

  async getStreet(id: string): Promise<StreetDetails | null> {
    return withTerytDatabase(this.dataDir, (db) =>
      queryOne(
        db,
        "SELECT SYM_UL AS code, id, name, placeId, stateDate FROM streets WHERE id = ? OR SYM_UL = ?",
        [id, id],
        mapStreet,
      ),
    );
  }

  async getUnit(id: string): Promise<UnitDetails | null> {
    return withTerytDatabase(this.dataDir, (db) => queryOne(db, "SELECT id, name, stateDate, type FROM units WHERE id = ?", [id], mapUnit));
  }

  async listAddresses(): Promise<readonly ResolvedAddress[]> {
    return withTerytDatabase(this.dataDir, (db) =>
      queryMany(
        db,
        `SELECT
          streets.id AS id,
          streets.stateDate AS stateDate,
          streets.SYM_UL AS streetCode,
          streets.name AS streetName,
          places.id AS placeId,
          places.name AS placeName,
          units.id AS unitId,
          units.name AS unitName,
          units.type AS unitType
        FROM streets
        JOIN places ON places.id = streets.placeId
        JOIN units ON units.id = places.unitId
        ORDER BY places.name, streets.name, streets.id`,
        [],
        mapAddress,
      ),
    );
  }

  async listPlaces(): Promise<readonly Place[]> {
    return withTerytDatabase(this.dataDir, (db) => queryMany(db, "SELECT id, name, stateDate, unitId FROM places ORDER BY name, id", [], mapPlace));
  }

  async listStreets(): Promise<readonly Street[]> {
    return withTerytDatabase(this.dataDir, (db) =>
      queryMany(db, "SELECT SYM_UL AS code, id, name, placeId, stateDate FROM streets ORDER BY name, id", [], mapStreet),
    );
  }

  async listUnits(): Promise<readonly Unit[]> {
    return withTerytDatabase(this.dataDir, (db) => queryMany(db, "SELECT id, name, stateDate, type FROM units ORDER BY name, id", [], mapUnit));
  }
}

function mapPlace(row: SqlRow): Place {
  return {
    id: readText(row.id),
    name: readText(row.name),
    stateDate: readText(row.stateDate),
    unitId: readText(row.unitId),
  };
}

function mapStreet(row: SqlRow): Street {
  return {
    code: readText(row.code),
    id: readText(row.id),
    name: readText(row.name),
    placeId: readText(row.placeId),
    stateDate: readText(row.stateDate),
  };
}

function mapUnit(row: SqlRow): Unit {
  return {
    id: readText(row.id),
    name: readText(row.name),
    stateDate: readText(row.stateDate),
    type: readText(row.type),
  };
}

function mapAddress(row: SqlRow): ResolvedAddress {
  const streetId = readText(row.id);

  return {
    id: streetId,
    place: {
      id: readText(row.placeId),
      name: readText(row.placeName),
    },
    stateDate: readText(row.stateDate),
    street: {
      code: readText(row.streetCode),
      id: streetId,
      name: readText(row.streetName),
    },
    unit: {
      id: readText(row.unitId),
      name: readText(row.unitName),
      type: readText(row.unitType),
    },
  };
}

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

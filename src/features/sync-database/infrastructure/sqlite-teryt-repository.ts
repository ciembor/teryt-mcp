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
import { queryMany, queryOne, withTerytDatabase } from "./sqlite-query.js";
import { mapAddress, mapPlace, mapStreet, mapUnit } from "./sqlite-row-mappers.js";
import { findSearchCandidates } from "./sqlite-search-candidates.js";
import { escapeLikePattern } from "./sqlite-like.js";

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
        "SELECT SYM_UL AS code, id, name, placeId, stateDate FROM streets WHERE id = ?",
        [id],
        mapStreet,
      ),
    );
  }

  async getUnit(id: string): Promise<UnitDetails | null> {
    return withTerytDatabase(this.dataDir, (db) => queryOne(db, "SELECT id, name, stateDate, type FROM units WHERE id = ?", [id], mapUnit));
  }

  async findAddresses(input: {
    readonly limit: number;
    readonly place: string;
    readonly query: string;
    readonly street: string;
  }): Promise<readonly ResolvedAddress[]> {
    const escapedQuery = escapeLikePattern(input.query);

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
        WHERE streets.id = ?
          OR (? <> '' AND places.normalizedName = ? AND streets.normalizedName = ?)
          OR (? <> '' AND (
            (places.normalizedName || ' ' || streets.normalizedName) LIKE ? ESCAPE '\\'
            OR (streets.normalizedName || ' ' || places.normalizedName) LIKE ? ESCAPE '\\'
            OR (places.normalizedName || ' ' || streets.normalizedName) LIKE ? ESCAPE '\\'
            OR (streets.normalizedName || ' ' || places.normalizedName) LIKE ? ESCAPE '\\'
            OR ? LIKE '%' || places.normalizedName || ' ' || streets.normalizedName || '%'
            OR ? LIKE '%' || streets.normalizedName || ' ' || places.normalizedName || '%'
          ))
        ORDER BY places.name, streets.name, streets.id
        LIMIT ?`,
        [
          input.query,
          input.place,
          input.place,
          input.street,
          input.query,
          `${escapedQuery}%`,
          `${escapedQuery}%`,
          `%${escapedQuery}%`,
          `%${escapedQuery}%`,
          input.query,
          input.query,
          input.limit,
        ],
        mapAddress,
      ),
    );
  }

  async findPlaces(query: string, limit: number): Promise<readonly Place[]> {
    return withTerytDatabase(this.dataDir, (db) =>
      findSearchCandidates(db, "places", query, limit, mapPlace),
    );
  }

  async findStreets(query: string, limit: number): Promise<readonly Street[]> {
    return withTerytDatabase(this.dataDir, (db) =>
      findSearchCandidates(
        db,
        "streets",
        query,
        limit,
        mapStreet,
        "SYM_UL",
      ),
    );
  }

  async findUnits(query: string, limit: number): Promise<readonly Unit[]> {
    return withTerytDatabase(this.dataDir, (db) =>
      findSearchCandidates(db, "units", query, limit, mapUnit),
    );
  }
}

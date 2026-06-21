import type { ResolvedAddress } from "../../resolve-address/domain/address.js";
import type { Place } from "../../search-places/domain/place.js";
import type { Street } from "../../search-streets/domain/street.js";
import type { Unit } from "../../search-units/domain/unit.js";
import type { SqlRow } from "./sqlite-query.js";

export function mapPlace(row: SqlRow): Place {
  return {
    id: readText(row.id),
    name: readText(row.name),
    stateDate: readText(row.stateDate),
    unitId: readText(row.unitId),
  };
}

export function mapStreet(row: SqlRow): Street {
  return {
    code: readText(row.code ?? row.SYM_UL),
    id: readText(row.id),
    name: readText(row.name),
    placeId: readText(row.placeId),
    stateDate: readText(row.stateDate),
  };
}

export function mapUnit(row: SqlRow): Unit {
  return {
    id: readText(row.id),
    name: readText(row.name),
    stateDate: readText(row.stateDate),
    type: readText(row.type),
  };
}

export function mapAddress(row: SqlRow): ResolvedAddress {
  const streetId = readText(row.id);

  return {
    id: streetId,
    place: { id: readText(row.placeId), name: readText(row.placeName) },
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

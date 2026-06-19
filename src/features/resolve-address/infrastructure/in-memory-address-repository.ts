import type { AddressRepository } from "../application/ports/address-repository.js";
import type { ResolvedAddress } from "../domain/address.js";

const fixturePlace = {
  id: "0009876",
  name: "Bolesławiec",
};
const fixtureStateDate = "2026-01-01";
const fixtureUnit = {
  id: "02-01-01-1",
  name: "Bolesławiec",
  type: "gmina miejska",
};

const fixtureAddresses: readonly ResolvedAddress[] = [
  {
    id: "0009876-0000123",
    place: fixturePlace,
    stateDate: fixtureStateDate,
    street: {
      code: "0000123",
      id: "0009876-0000123",
      name: "Marszałkowska",
    },
    unit: fixtureUnit,
  },
  {
    id: "0009876-0000456",
    place: fixturePlace,
    stateDate: fixtureStateDate,
    street: {
      code: "0000456",
      id: "0009876-0000456",
      name: "Rynek",
    },
    unit: fixtureUnit,
  },
];

export class InMemoryAddressRepository implements AddressRepository {
  async listAddresses(): Promise<readonly ResolvedAddress[]> {
    return fixtureAddresses;
  }
}

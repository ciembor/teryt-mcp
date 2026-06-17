import type { AddressRepository } from "../application/ports/address-repository.js";
import type { ResolvedAddress } from "../domain/address.js";

const fixtureAddresses: readonly ResolvedAddress[] = [
  {
    id: "0009876-0000123",
    place: {
      id: "0009876",
      name: "Bolesławiec",
    },
    stateDate: "2026-01-01",
    street: {
      code: "0000123",
      id: "0009876-0000123",
      name: "Marszałkowska",
    },
    unit: {
      id: "02-01-01-1",
      name: "Bolesławiec",
      type: "gmina miejska",
    },
  },
  {
    id: "0009876-0000456",
    place: {
      id: "0009876",
      name: "Bolesławiec",
    },
    stateDate: "2026-01-01",
    street: {
      code: "0000456",
      id: "0009876-0000456",
      name: "Rynek",
    },
    unit: {
      id: "02-01-01-1",
      name: "Bolesławiec",
      type: "gmina miejska",
    },
  },
];

export class InMemoryAddressRepository implements AddressRepository {
  async listAddresses(): Promise<readonly ResolvedAddress[]> {
    return fixtureAddresses;
  }
}

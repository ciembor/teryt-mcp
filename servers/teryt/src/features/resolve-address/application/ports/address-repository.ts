import type { ResolvedAddress } from "../../domain/address.js";

export type AddressRepository = {
  readonly listAddresses: () => Promise<readonly ResolvedAddress[]>;
};

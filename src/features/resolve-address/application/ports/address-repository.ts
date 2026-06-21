import type { ResolvedAddress } from "../../domain/address.js";

export type AddressRepository = {
  readonly findAddresses: (input: {
    readonly limit: number;
    readonly place: string;
    readonly query: string;
    readonly street: string;
  }) => Promise<readonly ResolvedAddress[]>;
};

import type { AddressMatch, ResolvedAddress } from "../domain/address.js";
import type { AddressRepository } from "./ports/address-repository.js";

type ResolveAddressInput = {
  readonly limit?: number;
  readonly query: string;
};

export type ResolveAddressDependencies = {
  readonly addressRepository: AddressRepository;
};

type ResolveAddressResult = {
  readonly addresses: readonly AddressMatch[];
  readonly stateDate: string | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function resolveAddress(
  input: ResolveAddressInput,
  dependencies: ResolveAddressDependencies,
): Promise<ResolveAddressResult> {
  const limit = normalizeLimit(input.limit);
  const query = input.query.trim();

  if (!query) {
    return {
      addresses: [],
      stateDate: null,
    };
  }

  const normalizedQuery = normalizeName(query);
  const addresses = await dependencies.addressRepository.listAddresses();
  const matches = addresses
    .flatMap((address): readonly AddressMatch[] => {
      if (address.id === query) {
        return [
          {
            address,
            confidence: 1,
            matchedBy: "exact_code",
          },
        ];
      }

      const normalizedAddress = normalizeName(formatAddress(address));

      if (normalizedAddress === normalizedQuery) {
        return [
          {
            address,
            confidence: 0.95,
            matchedBy: "exact_normalized_address",
          },
        ];
      }

      if (normalizedAddress.startsWith(normalizedQuery)) {
        return [
          {
            address,
            confidence: 0.75,
            matchedBy: "prefix",
          },
        ];
      }

      return [];
    })
    .sort(
      (left, right) =>
        right.confidence - left.confidence || formatAddress(left.address).localeCompare(formatAddress(right.address)),
    )
    .slice(0, limit);

  return {
    addresses: matches,
    stateDate: matches[0]?.address.stateDate ?? null,
  };
}

function formatAddress(address: ResolvedAddress): string {
  return [address.place.name, address.street?.name].filter(Boolean).join(" ");
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("resolve_address limit must be a positive integer.");
  }

  return Math.min(limit, MAX_LIMIT);
}

function normalizeName(value: string): string {
  return value
    .replaceAll("ł", "l")
    .replaceAll("Ł", "L")
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pl-PL");
}

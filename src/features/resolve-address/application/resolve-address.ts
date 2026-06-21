import type { AddressMatch, ResolvedAddress } from "../domain/address.js";
import type { AddressRepository } from "./ports/address-repository.js";
import { normalizePolishText } from "../../../shared/normalize-polish-text.js";

type ResolveAddressInput = {
  readonly limit?: number;
  readonly place?: string;
  readonly query?: string;
  readonly street?: string;
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
  const query = input.query?.trim() ?? "";
  const place = input.place?.trim() ?? "";
  const street = input.street?.trim() ?? "";

  if (!query && (!place || !street)) {
    return {
      addresses: [],
      stateDate: null,
    };
  }

  const normalizedQuery = normalizeAddressText(query);
  const normalizedPlace = normalizeAddressText(place);
  const normalizedStreet = normalizeAddressText(street);
  const addresses = await dependencies.addressRepository.findAddresses({
    limit: Math.max(100, limit * 10),
    place: normalizedPlace,
    query: normalizedQuery,
    street: normalizedStreet,
  });
  const matches = addresses
    .map((address) => matchAddress(address, { normalizedPlace, normalizedQuery, normalizedStreet, query }))
    .filter((match): match is AddressMatch => match !== null)
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

type MatchContext = {
  readonly normalizedPlace: string;
  readonly normalizedQuery: string;
  readonly normalizedStreet: string;
  readonly query: string;
};

function matchAddress(address: ResolvedAddress, context: MatchContext): AddressMatch | null {
  if (context.query && address.id === context.query) {
    return { address, confidence: 1, matchedBy: "exact_code" };
  }

  const placeName = normalizeAddressText(address.place.name);
  const streetName = normalizeAddressText(address.street.name);
  const addressTexts = [`${placeName} ${streetName}`.trim(), `${streetName} ${placeName}`.trim()];

  if (isExactAddress(placeName, streetName, addressTexts, context)) {
    return { address, confidence: 0.95, matchedBy: "exact_normalized_address" };
  }

  if (context.normalizedQuery && addressTexts.some((value) => value.startsWith(context.normalizedQuery))) {
    return { address, confidence: 0.75, matchedBy: "prefix" };
  }

  if (
    context.normalizedQuery &&
    addressTexts.some((value) => value.includes(context.normalizedQuery) || context.normalizedQuery.includes(value))
  ) {
    return { address, confidence: 0.6, matchedBy: "contains" };
  }

  return null;
}

function isExactAddress(
  placeName: string,
  streetName: string,
  addressTexts: readonly string[],
  context: MatchContext,
): boolean {
  if (context.normalizedPlace) {
    return placeName === context.normalizedPlace && streetName === context.normalizedStreet;
  }

  return Boolean(context.normalizedQuery) && addressTexts.includes(context.normalizedQuery);
}

function formatAddress(address: ResolvedAddress): string {
  return `${address.place.name} ${address.street.name}`;
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

function normalizeAddressText(value: string): string {
  const ignoredWords = new Set(["al", "aleja", "alei", "pl", "plac", "ul", "ulica", "ulice", "ulicy", "w", "we"]);

  return normalizePolishText(value)
    .replaceAll(",", " ")
    .replaceAll(".", " ")
    .replaceAll(":", " ")
    .replaceAll(";", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("\n", " ")
    .replaceAll("\r", " ")
    .replaceAll("\t", " ")
    .split(" ")
    .filter((word) => word && !ignoredWords.has(word))
    .map(normalizePolishInflection)
    .join(" ");
}

function normalizePolishInflection(word: string): string {
  const suffixes: readonly [string, string][] = [
    ["skiej", "ska"],
    ["ckiej", "cka"],
    ["owej", "owa"],
    ["awie", "awa"],
    ["owie", "ow"],
    ["aniu", "an"],
    ["sku", "sk"],
    ["dzi", "dz"],
    ["cu", "iec"],
    ["ie", ""],
  ];
  const suffix = suffixes.find(([ending]) => word.length > ending.length + 2 && word.endsWith(ending));

  return suffix ? `${word.slice(0, -suffix[0].length)}${suffix[1]}` : word;
}

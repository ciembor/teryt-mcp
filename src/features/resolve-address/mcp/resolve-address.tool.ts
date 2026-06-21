import { defineTool } from "@mcp-craftsman/core";

import { resolveAddress, type ResolveAddressDependencies } from "../application/resolve-address.js";
import { resolveAddressInputSchema, resolveAddressOutputSchema } from "./resolve-address.schemas.js";
import { assertSupportedAddressText } from "./address-input-validation.js";

export function createResolveAddressTool(dependencies: ResolveAddressDependencies) {
  return defineTool({
    inputSchema: resolveAddressInputSchema,
    outputSchema: resolveAddressOutputSchema,
    name: "resolve_address",
    description:
      "Resolve a Polish locality plus street to TERYT identifiers: TERC unit, SIMC place and ULIC street. Use when the user provides both a miejscowość and ulica, for example 'Warszawa Marszałkowska' or 'ulica Marszałkowska w Warszawie'. Prefer structured place and street fields when possible. This is not geocoding and does not validate building numbers, postal codes or coordinates.",
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await resolveAddress(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly limit?: number; readonly place?: string; readonly query?: string; readonly street?: string } {
  if (typeof input !== "object" || input === null) {
    throw new Error("resolve_address input must be an object.");
  }

  const value = input as Record<string, unknown>;
  const query = readOptionalString(value, "query");
  const place = readOptionalString(value, "place");
  const street = readOptionalString(value, "street");
  const limit = value.limit;

  if (!query && (!place || !street)) {
    throw new Error("resolve_address requires query or both place and street.");
  }

  if (limit !== undefined && typeof limit !== "number") {
    throw new Error("resolve_address limit must be a number.");
  }

  assertSupportedAddressText(query, place, street);

  return { limit, place, query, street };
}

function readOptionalString(input: Record<string, unknown>, field: string): string | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`resolve_address ${field} must be a string.`);
  }

  return value;
}

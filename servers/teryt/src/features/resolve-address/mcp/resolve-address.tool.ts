import { defineTool } from "@mcp-kit/core";

import { resolveAddress, type ResolveAddressDependencies } from "../application/resolve-address.js";

export function createResolveAddressTool(dependencies: ResolveAddressDependencies) {
  return defineTool({
    name: "resolve_address",
    description: "Resolves a TERYT address candidate to territorial, place, and street identifiers.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
        },
        limit: {
          type: "number",
          default: 20,
          maximum: 100,
          minimum: 1,
        },
      },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        addresses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                  },
                  place: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                    },
                    required: ["id", "name"],
                  },
                  stateDate: {
                    type: "string",
                  },
                  street: {
                    anyOf: [
                      {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                          },
                          id: {
                            type: "string",
                          },
                          name: {
                            type: "string",
                          },
                        },
                        required: ["code", "id", "name"],
                      },
                      {
                        type: "null",
                      },
                    ],
                  },
                  unit: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      type: {
                        type: "string",
                      },
                    },
                    required: ["id", "name", "type"],
                  },
                },
                required: ["id", "place", "stateDate", "street", "unit"],
              },
              confidence: {
                type: "number",
              },
              matchedBy: {
                type: "string",
                enum: ["exact_code", "exact_normalized_address", "prefix"],
              },
            },
            required: ["address", "confidence", "matchedBy"],
          },
        },
        stateDate: {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "null",
            },
          ],
        },
      },
      required: ["addresses", "stateDate"],
    },
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

function parseInput(input: unknown): { readonly limit?: number; readonly query: string } {
  if (typeof input !== "object" || input === null || !("query" in input) || typeof input.query !== "string") {
    throw new Error("resolve_address requires query.");
  }

  const limit = "limit" in input ? input.limit : undefined;

  if (limit !== undefined && typeof limit !== "number") {
    throw new Error("resolve_address limit must be a number.");
  }

  return {
    limit,
    query: input.query,
  };
}

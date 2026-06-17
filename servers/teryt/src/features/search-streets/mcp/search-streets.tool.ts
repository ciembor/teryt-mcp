import { defineTool } from "@mcp-kit/core";

import { searchStreets, type SearchStreetsDependencies } from "../application/search-streets.js";

export function createSearchStreetsTool(dependencies: SearchStreetsDependencies) {
  return defineTool({
    name: "search_streets",
    description: "Searches TERYT streets.",
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
        streets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              confidence: {
                type: "number",
              },
              matchedBy: {
                type: "string",
                enum: ["exact_code", "exact_normalized_name", "prefix"],
              },
              street: {
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
                  placeId: {
                    type: "string",
                  },
                  stateDate: {
                    type: "string",
                  },
                },
                required: ["code", "id", "name", "placeId", "stateDate"],
              },
            },
            required: ["confidence", "matchedBy", "street"],
          },
        },
      },
      required: ["stateDate", "streets"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await searchStreets(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly limit?: number; readonly query: string } {
  if (typeof input !== "object" || input === null || !("query" in input) || typeof input.query !== "string") {
    throw new Error("search_streets requires query.");
  }

  const limit = "limit" in input ? input.limit : undefined;

  if (limit !== undefined && typeof limit !== "number") {
    throw new Error("search_streets limit must be a number.");
  }

  return {
    limit,
    query: input.query,
  };
}

import { defineTool } from "@mcp-kit/core";

import { searchUnits, type SearchUnitsDependencies } from "../application/search-units.js";

export function createSearchUnitsTool(dependencies: SearchUnitsDependencies) {
  return defineTool({
    name: "search_units",
    description: "Searches TERYT territorial units.",
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
        units: {
          type: "array",
          items: {
            type: "object",
            properties: {
              confidence: {
                type: "number",
              },
              matchedBy: {
                type: "string",
                enum: ["exact_code", "exact_normalized_name", "prefix", "fts"],
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
                  stateDate: {
                    type: "string",
                  },
                  type: {
                    type: "string",
                  },
                },
                required: ["id", "name", "stateDate", "type"],
              },
            },
            required: ["confidence", "matchedBy", "unit"],
          },
        },
      },
      required: ["stateDate", "units"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await searchUnits(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly limit?: number; readonly query: string } {
  if (typeof input !== "object" || input === null || !("query" in input) || typeof input.query !== "string") {
    throw new Error("search_units requires query.");
  }

  const limit = "limit" in input ? input.limit : undefined;

  if (limit !== undefined && typeof limit !== "number") {
    throw new Error("search_units limit must be a number.");
  }

  return {
    limit,
    query: input.query,
  };
}

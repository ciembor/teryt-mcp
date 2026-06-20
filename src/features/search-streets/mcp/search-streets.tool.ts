import { defineTool, readQueryLimitInput } from "@mcp-craftman/core";

import { searchStreets, type SearchStreetsDependencies } from "../application/search-streets.js";

export function createSearchStreetsTool(dependencies: SearchStreetsDependencies) {
  return defineTool({
    inputSchema,
    outputSchema,
    name: "search_streets",
    description: "Searches TERYT streets.",
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await searchStreets(readQueryLimitInput(input, "search_streets"), dependencies),
    }),
  });
}

const inputSchema = {
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
};

const outputSchema = {
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
            enum: ["exact_code", "exact_normalized_name", "prefix", "fts"],
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
};

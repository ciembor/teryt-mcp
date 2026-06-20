import { defineTool, readQueryLimitInput } from "@mcp-craftman/core";

import { searchPlaces, type SearchPlacesDependencies } from "../application/search-places.js";

export function createSearchPlacesTool(dependencies: SearchPlacesDependencies) {
  return defineTool({
    name: "search_places",
    description: "Searches TERYT places.",
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
        places: {
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
              place: {
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
                  unitId: {
                    type: "string",
                  },
                },
                required: ["id", "name", "stateDate", "unitId"],
              },
            },
            required: ["confidence", "matchedBy", "place"],
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
      required: ["places", "stateDate"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await searchPlaces(readQueryLimitInput(input, "search_places"), dependencies),
    }),
  });
}

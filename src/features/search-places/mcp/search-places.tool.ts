import { defineTool, readQueryLimitInput } from "@mcp-craftsman/core";

import { searchPlaces, type SearchPlacesDependencies } from "../application/search-places.js";

export function createSearchPlacesTool(dependencies: SearchPlacesDependencies) {
  return defineTool({
    name: "search_places",
    description:
      "Search SIMC localities/miejscowości such as cities, towns and villages. Use for requests about miejscowość, wieś, miasto as a locality, SIMC or identyfikator miejscowości. Do not use for administrative gminy/powiaty; use search_units instead.",
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
                enum: ["exact_code", "exact_normalized_name", "prefix", "contains"],
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

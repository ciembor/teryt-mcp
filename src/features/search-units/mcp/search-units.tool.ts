import { defineTool, readQueryLimitInput } from "@mcp-craftsman/core";

import { searchUnits, type SearchUnitsDependencies } from "../application/search-units.js";

export function createSearchUnitsTool(dependencies: SearchUnitsDependencies) {
  return defineTool({
    name: "search_units",
    description:
      "Search TERC administrative units: województwa, powiaty, gminy and commune types. Use for Polish requests about jednostka TERYT, TERC, kod województwa/powiatu/gminy. Do not use for SIMC localities/miejscowości; use search_places instead.",
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
                enum: ["exact_code", "exact_normalized_name", "prefix", "contains"],
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
      structuredContent: await searchUnits(readQueryLimitInput(input, "search_units"), dependencies),
    }),
  });
}

import { defineTool, readQueryLimitInput } from "@mcp-craftman/core";

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
      structuredContent: await searchUnits(readQueryLimitInput(input, "search_units"), dependencies),
    }),
  });
}

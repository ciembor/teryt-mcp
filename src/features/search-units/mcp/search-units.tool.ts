import { defineTool, readQueryLimitInput } from "@mcp-craftsman/core";

import { createSearchOutputSchema, queryLimitInputSchema } from "../../../mcp/search-schemas.js";
import { searchUnits, type SearchUnitsDependencies } from "../application/search-units.js";

export function createSearchUnitsTool(dependencies: SearchUnitsDependencies) {
  return defineTool({
    name: "search_units",
    description:
      "Search TERC administrative units: województwa, powiaty, gminy and commune types. Use for Polish requests about jednostka TERYT, TERC, kod województwa/powiatu/gminy. Do not use for SIMC localities/miejscowości; use search_places instead.",
    inputSchema: queryLimitInputSchema,
    outputSchema: createSearchOutputSchema("units", "unit", {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        stateDate: { type: "string" },
        type: { type: "string" },
      },
      required: ["id", "name", "stateDate", "type"],
    }),
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

import { defineTool, readQueryLimitInput } from "@mcp-craftsman/core";

import { createSearchOutputSchema, queryLimitInputSchema } from "../../../mcp/search-schemas.js";
import { searchStreets, type SearchStreetsDependencies } from "../application/search-streets.js";

export function createSearchStreetsTool(dependencies: SearchStreetsDependencies) {
  return defineTool({
    inputSchema: queryLimitInputSchema,
    outputSchema: createSearchOutputSchema("streets", "street", {
      type: "object",
      properties: {
        code: { type: "string" },
        id: { type: "string" },
        name: { type: "string" },
        placeId: { type: "string" },
        stateDate: { type: "string" },
      },
      required: ["code", "id", "name", "placeId", "stateDate"],
    }),
    name: "search_streets",
    description:
      "Search ULIC street names across all localities. Use when the user asks for a street without a specific locality. If both locality/miejscowość and street/ulica are provided, use resolve_address instead.",
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

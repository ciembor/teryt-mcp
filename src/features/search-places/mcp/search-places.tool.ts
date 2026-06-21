import { defineTool, readQueryLimitInput } from "@mcp-craftsman/core";

import { createSearchOutputSchema, queryLimitInputSchema } from "../../../mcp/search-schemas.js";
import { searchPlaces, type SearchPlacesDependencies } from "../application/search-places.js";

export function createSearchPlacesTool(dependencies: SearchPlacesDependencies) {
  return defineTool({
    name: "search_places",
    description:
      "Search SIMC localities/miejscowości such as cities, towns and villages. Use for requests about miejscowość, wieś, miasto as a locality, SIMC or identyfikator miejscowości. Do not use for administrative gminy/powiaty; use search_units instead.",
    inputSchema: queryLimitInputSchema,
    outputSchema: createSearchOutputSchema("places", "place", {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        stateDate: { type: "string" },
        unitId: { type: "string" },
      },
      required: ["id", "name", "stateDate", "unitId"],
    }),
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

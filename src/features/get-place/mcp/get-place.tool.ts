import { defineTool, readRequiredStringField } from "@mcp-craftman/core";

import { getPlace, type GetPlaceDependencies } from "../application/get-place.js";

export function createGetPlaceTool(dependencies: GetPlaceDependencies) {
  return defineTool({
    name: "get_place",
    description: "Gets a TERYT place by identifier.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
      },
      required: ["id"],
    },
    outputSchema: {
      type: "object",
      properties: {
        place: {
          anyOf: [
            {
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
            {
              type: "null",
            },
          ],
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
      required: ["place", "stateDate"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await getPlace(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly id: string } {
  return {
    id: readRequiredStringField(input, "id", "get_place"),
  };
}

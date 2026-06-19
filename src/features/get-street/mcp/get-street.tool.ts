import { defineTool } from "@mcp-craftman/core";

import { getStreet, type GetStreetDependencies } from "../application/get-street.js";

export function createGetStreetTool(dependencies: GetStreetDependencies) {
  return defineTool({
    name: "get_street",
    description: "Gets a TERYT street by identifier.",
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
        street: {
          anyOf: [
            {
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
            {
              type: "null",
            },
          ],
        },
      },
      required: ["stateDate", "street"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await getStreet(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly id: string } {
  if (typeof input !== "object" || input === null || !("id" in input) || typeof input.id !== "string") {
    throw new Error("get_street requires id.");
  }

  return {
    id: input.id,
  };
}

import { defineTool, readRequiredStringField } from "@mcp-craftsman/core";

import { getStreet, type GetStreetDependencies } from "../application/get-street.js";

export function createGetStreetTool(dependencies: GetStreetDependencies) {
  return defineTool({
    name: "get_street",
    description:
      "Get one concrete ULIC street by its full identifier in SIMC-SYM_UL format, for example 0918123-22021. A bare SYM_UL street-name code is not unique and is not accepted as a lookup identifier; use search_streets instead.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          pattern: "^[0-9]{7}-[0-9]{5}$",
          description: "Full street identifier: 7-digit SIMC place id, hyphen, 5-digit SYM_UL code.",
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
  return {
    id: readRequiredStringField(input, "id", "get_street"),
  };
}

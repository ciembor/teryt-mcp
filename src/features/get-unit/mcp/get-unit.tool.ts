import { defineTool, readRequiredStringField } from "@mcp-craftsman/core";

import { getUnit, type GetUnitDependencies } from "../application/get-unit.js";

export function createGetUnitTool(dependencies: GetUnitDependencies) {
  return defineTool({
    name: "get_unit",
    description: "Gets a TERYT territorial unit by identifier.",
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
        unit: {
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
                type: {
                  type: "string",
                },
              },
              required: ["id", "name", "stateDate", "type"],
            },
            {
              type: "null",
            },
          ],
        },
      },
      required: ["stateDate", "unit"],
    },
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await getUnit(parseInput(input), dependencies),
    }),
  });
}

function parseInput(input: unknown): { readonly id: string } {
  return {
    id: readRequiredStringField(input, "id", "get_unit"),
  };
}

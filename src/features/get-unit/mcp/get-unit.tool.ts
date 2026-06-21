import { defineTool, readRequiredStringField } from "@mcp-craftsman/core";

import { getUnit, type GetUnitDependencies } from "../application/get-unit.js";

export function createGetUnitTool(dependencies: GetUnitDependencies) {
  return defineTool({
    name: "get_unit",
    description: "Get a TERC administrative unit by its full TERYT identifier, for example 02-01-01-1.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          pattern: "^[0-9]{2}(?:-[0-9]{2})?(?:-[0-9]{2}-[0-9])?$",
          description: "TERC unit identifier, for example 02 or 02-01-01-1.",
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

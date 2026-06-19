import { defineTool } from "@mcp-craftman/core";

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
  if (typeof input !== "object" || input === null || !("id" in input) || typeof input.id !== "string") {
    throw new Error("get_unit requires id.");
  }

  return {
    id: input.id,
  };
}

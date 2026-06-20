import { defineTool, readQueryLimitInput } from "@mcp-craftman/core";

import { resolveAddress, type ResolveAddressDependencies } from "../application/resolve-address.js";

export function createResolveAddressTool(dependencies: ResolveAddressDependencies) {
  return defineTool({
    inputSchema,
    outputSchema,
    name: "resolve_address",
    description: "Resolves a TERYT address candidate to territorial, place, and street identifiers.",
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async (input) => ({
      structuredContent: await resolveAddress(readQueryLimitInput(input, "resolve_address"), dependencies),
    }),
  });
}

const inputSchema = {
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
};

const outputSchema = {
  type: "object",
  properties: {
    addresses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              place: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                },
                required: ["id", "name"],
              },
              stateDate: {
                type: "string",
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
                    },
                    required: ["code", "id", "name"],
                  },
                  {
                    type: "null",
                  },
                ],
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
                  type: {
                    type: "string",
                  },
                },
                required: ["id", "name", "type"],
              },
            },
            required: ["id", "place", "stateDate", "street", "unit"],
          },
          confidence: {
            type: "number",
          },
          matchedBy: {
            type: "string",
            enum: ["exact_code", "exact_normalized_address", "prefix"],
          },
        },
        required: ["address", "confidence", "matchedBy"],
      },
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
  required: ["addresses", "stateDate"],
};

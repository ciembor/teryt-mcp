import { defineTool } from "@mcp-kit/core";

import { getSourceStatus, type GetSourceStatusInput } from "../application/get-source-status.js";

export function createSourceStatusTool(input: GetSourceStatusInput) {
  return defineTool({
    name: "source_status",
    description: "Returns official TERYT source dataset status.",
    policy: "read",
    returnsStructuredContent: true,
    outputSchema: {
      type: "object",
      properties: {
        datasets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dataset: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    enum: ["TERC", "SIMC", "ULIC", "WMRODZ"],
                  },
                  name: {
                    type: "string",
                  },
                  sourceUrl: {
                    type: "string",
                  },
                },
                required: ["code", "name", "sourceUrl"],
              },
              snapshot: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      dataset: {
                        type: "string",
                        enum: ["TERC", "SIMC", "ULIC", "WMRODZ"],
                      },
                      version: {
                        type: "string",
                      },
                      downloadedAt: {
                        type: "string",
                      },
                      sourceUrl: {
                        type: "string",
                      },
                    },
                    required: ["dataset", "version", "downloadedAt", "sourceUrl"],
                  },
                  {
                    type: "null",
                  },
                ],
              },
            },
            required: ["dataset", "snapshot"],
          },
        },
      },
      required: ["datasets"],
    },
    annotations: {
      readOnlyHint: true,
    },
    handler: async () => ({
      structuredContent: await getSourceStatus(input),
    }),
  });
}

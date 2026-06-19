import { defineTool } from "@mcp-craftman/core";

import { getSourceStatus, type GetSourceStatusInput } from "../application/get-source-status.js";

export function createSourceStatusTool(input: GetSourceStatusInput) {
  return defineTool({
    outputSchema,
    name: "source_status",
    description: "Returns official TERYT source dataset status.",
    policy: "read",
    returnsStructuredContent: true,
    annotations: {
      readOnlyHint: true,
    },
    handler: async () => ({
      structuredContent: await getSourceStatus(input),
    }),
  });
}

const outputSchema = {
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
                  recordCount: {
                    type: "number",
                  },
                  sha256: {
                    type: "string",
                  },
                  sourceUrl: {
                    type: "string",
                  },
                  stateDate: {
                    type: "string",
                  },
                },
                required: ["dataset", "downloadedAt", "sourceUrl"],
              },
              {
                type: "null",
              },
            ],
          },
          sha256: {
            anyOf: [
              {
                type: "string",
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
        required: ["dataset", "sha256", "snapshot", "stateDate"],
      },
    },
    lastCheckedAt: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
    lastSuccessfulSync: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
    localDatabase: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["missing", "available"],
        },
      },
      required: ["status"],
    },
    remoteSource: {
      type: "object",
      properties: {
        errors: {
          type: "array",
          items: {
            type: "string",
          },
        },
        status: {
          type: "string",
          enum: ["unknown", "available", "error"],
        },
      },
      required: ["errors", "status"],
    },
  },
  required: ["datasets", "lastCheckedAt", "lastSuccessfulSync", "localDatabase", "remoteSource"],
};

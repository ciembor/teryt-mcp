import { defineTool, mcpKitCoreVersion } from "@mcp-kit/core";

import { getServerStatus, type GetServerStatusInput } from "../application/get-server-status.js";

type CreateServerStatusToolInput = Omit<GetServerStatusInput, "frameworkVersion">;

export function createServerStatusTool(input: CreateServerStatusToolInput) {
  return defineTool({
    name: "server_status",
    description: "Returns server runtime status.",
    policy: "read",
    returnsStructuredContent: true,
    outputSchema: {
      type: "object",
      properties: {
        serverName: {
          type: "string",
        },
        serverVersion: {
          type: "string",
        },
        frameworkVersion: {
          type: "string",
        },
        transport: {
          type: "string",
          enum: ["stdio", "http"],
        },
        dataDir: {
          type: "string",
        },
        database: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["not_configured"],
            },
          },
          required: ["status"],
        },
      },
      required: ["serverName", "serverVersion", "frameworkVersion", "transport", "dataDir", "database"],
    },
    annotations: {
      readOnlyHint: true,
    },
    handler: () => ({
      structuredContent: getServerStatus({
        ...input,
        frameworkVersion: mcpKitCoreVersion,
      }),
    }),
  });
}

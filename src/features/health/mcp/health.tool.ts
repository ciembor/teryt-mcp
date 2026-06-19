import { defineTool } from "@mcp-craftman/core";

import { getHealth } from "../application/get-health.js";

export const healthTool = defineTool({
  name: "health_status",
  description: "Returns basic server health.",
  policy: "read",
  returnsStructuredContent: true,
  outputSchema: {
    type: "object",
    properties: {
      ok: {
        type: "boolean",
      },
    },
    required: ["ok"],
  },
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: getHealth(),
  }),
});

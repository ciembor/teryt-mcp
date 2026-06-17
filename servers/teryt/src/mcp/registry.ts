import { createCapabilityRegistry } from "@mcp-kit/core";

import { healthTool } from "../features/health/index.js";

export const registry = createCapabilityRegistry([
  healthTool,
]);

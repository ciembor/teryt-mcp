import { describe, expect, it } from "vitest";

import { registry } from "../../src/mcp/registry.js";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    expect(registry.capabilities.map((capability) => capability.name)).toEqual(["health_status"]);
  });
});

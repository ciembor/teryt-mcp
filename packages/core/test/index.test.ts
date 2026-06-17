import { describe, expect, it } from "vitest";

import { corePackageName } from "../src/index";

describe("@mcp-kit/core", () => {
  it("exposes its public API through src/index.ts", () => {
    expect(corePackageName).toBe("@mcp-kit/core");
  });
});

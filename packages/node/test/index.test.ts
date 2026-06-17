import { describe, expect, it } from "vitest";

import { nodePackageName } from "../src/index";

describe("@mcp-kit/node", () => {
  it("exposes its public API through src/index.ts", () => {
    expect(nodePackageName).toBe("@mcp-kit/node");
  });
});

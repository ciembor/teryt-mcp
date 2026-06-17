import { describe, expect, it } from "vitest";

import { cliPackageName } from "../src/index";

describe("@mcp-kit/cli", () => {
  it("exposes its public API through src/index.ts", () => {
    expect(cliPackageName).toBe("@mcp-kit/cli");
  });
});

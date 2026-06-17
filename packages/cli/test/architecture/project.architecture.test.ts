import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { getQualitySteps } from "../../src/index.js";

describe("@mcp-kit/cli architecture", () => {
  it("keeps generated quality checks aligned with the required order", () => {
    expect(getQualitySteps().map(([command, args]) => [command, ...args].join(" "))).toEqual([
      "knip",
      "tsc --noEmit",
      "eslint . --fix",
      "dependency-cruiser",
      "vitest run test/architecture",
      "vitest run --coverage test/unit test/integration test/contracts",
    ]);
  });

  it("does not import private framework paths or server code", async () => {
    const source = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(source).not.toContain("@mcp-kit/core/src");
    expect(source).not.toContain("@mcp-kit/node/src");
    expect(source).not.toContain("servers/");
  });
});

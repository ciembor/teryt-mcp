import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-kit/core architecture", () => {
  it("keeps the public API behind one runtime-independent entrypoint", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual(["index.ts"]);
  });

  it("does not depend on Node.js runtime APIs", async () => {
    const source = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(source).not.toContain("from \"node:");
    expect(source).not.toContain("process.");
  });
});

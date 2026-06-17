import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-kit/node architecture", () => {
  it("keeps the public API behind one entrypoint", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual(["index.ts"]);
  });

  it("uses @mcp-kit/core only through its package export", async () => {
    const source = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(source).toContain("from \"@mcp-kit/core\"");
    expect(source).not.toContain("@mcp-kit/core/src");
    expect(source).not.toContain("../core");
  });
});

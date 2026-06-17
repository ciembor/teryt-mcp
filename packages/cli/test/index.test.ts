import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectFiles, getQualitySteps, initProject, isCliEntrypoint, runQuality } from "../src/index";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        recursive: true,
        force: true,
      }),
    ),
  );
  tempDirs.length = 0;
});

describe("@mcp-kit/cli", () => {
  it("defines the exact quality command sequence", async () => {
    const calls: string[] = [];

    await runQuality(async (command, args) => {
      calls.push([command, ...args].join(" "));
    });

    expect(calls).toEqual([
      "knip",
      "tsc --noEmit",
      "eslint . --fix",
      "dependency-cruiser",
      "vitest run test/architecture",
      "vitest run --coverage test/unit test/integration test/contracts",
    ]);
    expect(getQualitySteps()).toHaveLength(6);
  });

  it("detects execution through the package bin symlink", () => {
    expect(isCliEntrypoint("/repo/node_modules/.bin/mcp-kit")).toBe(true);
    expect(isCliEntrypoint("/repo/packages/cli/dist/index.js")).toBe(true);
    expect(isCliEntrypoint("/repo/node_modules/vitest/vitest.mjs")).toBe(false);
  });

  it("generates the expected server file set", () => {
    const files = createProjectFiles("TERYT MCP").map((file) => file.path);

    expect(files).toEqual(
      expect.arrayContaining([
        "src/app.ts",
        "src/main.ts",
        "src/mcp/registry.ts",
        "src/server/transports/http.ts",
        "src/server/transports/stdio.ts",
        "src/features/health/index.ts",
        "src/features/health/domain/health-status.ts",
        "src/features/health/application/get-health.ts",
        "src/features/health/mcp/health.tool.ts",
        "test/architecture/project.architecture.test.ts",
        "test/contracts/health.contract.test.ts",
        "test/integration/app.smoke.test.ts",
        "dependency-cruiser.config.cjs",
        "eslint.config.js",
        "knip.json",
        "vitest.config.ts",
      ]),
    );
  });

  it("initializes a project on disk", async () => {
    const directory = await createTempDir();
    const projectPath = join(directory, "teryt");

    await initProject({
      path: projectPath,
      name: "TERYT MCP",
    });

    await expect(stat(join(projectPath, "src/app.ts"))).resolves.toMatchObject({
      isFile: expect.any(Function),
    });
    await expect(readFile(join(projectPath, "package.json"), "utf8")).resolves.toContain('"name": "teryt-mcp"');
    await expect(readFile(join(projectPath, "src/mcp/registry.ts"), "utf8")).resolves.toContain("healthTool");
  });

  it("installs a root pre-commit hook that runs pnpm quality", async () => {
    const directory = await createTempDir();
    await mkdir(join(directory, ".git", "hooks"), {
      recursive: true,
    });

    await initProject({
      path: join(directory, "servers", "teryt"),
      name: "teryt-mcp",
    });

    await expect(readFile(join(directory, ".git", "hooks", "pre-commit"), "utf8")).resolves.toBe(`#!/bin/sh
set -e
pnpm quality
`);
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-kit-cli-"));
  tempDirs.push(path);
  return path;
}

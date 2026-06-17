#!/usr/bin/env node
import { mkdir, writeFile, chmod, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";

export type InitProjectOptions = {
  readonly path: string;
  readonly name: string;
};

export type QualityRunner = (command: string, args: readonly string[]) => Promise<void>;

export type GeneratedFile = {
  readonly path: string;
  readonly content: string;
};

const qualitySteps: readonly [string, readonly string[]][] = [
  ["knip", []],
  ["tsc", ["--noEmit"]],
  ["eslint", [".", "--fix"]],
  ["dependency-cruiser", []],
  ["vitest", ["run", "test/architecture"]],
  ["vitest", ["run", "--coverage", "test/unit", "test/integration", "test/contracts"]],
];

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const [command, ...args] = argv;

  if (command === "init") {
    await initProject(parseInitArgs(args));
    return;
  }

  if (command === "quality") {
    await runQuality();
    return;
  }

  throw new Error(`Unknown command: ${command ?? "<missing>"}`);
}

export async function initProject(options: InitProjectOptions): Promise<void> {
  const projectPath = resolve(options.path);
  const files = createProjectFiles(options.name);

  await Promise.all(
    files.map(async (file) => {
      const targetPath = join(projectPath, file.path);
      await mkdir(dirname(targetPath), {
        recursive: true,
      });
      await writeFile(targetPath, file.content);
    }),
  );

  await installPreCommitHook(projectPath);
}

export async function runQuality(runner: QualityRunner = runCommand): Promise<void> {
  for (const [command, args] of qualitySteps) {
    await runner(command, args);
  }
}

export function getQualitySteps(): readonly [string, readonly string[]][] {
  return qualitySteps;
}

export function createProjectFiles(name: string): readonly GeneratedFile[] {
  const packageName = normalizePackageName(name);

  return [
    {
      path: "package.json",
      content: `${JSON.stringify(
        {
          name: packageName,
          version: "0.0.0",
          private: true,
          type: "module",
          scripts: {
            build: "tsup src/main.ts --format esm --dts",
            quality: "mcp-kit quality",
            test: "vitest run",
          },
          dependencies: {
            "@mcp-kit/core": "workspace:*",
            "@mcp-kit/node": "workspace:*",
          },
          devDependencies: {
            "@mcp-kit/cli": "workspace:*",
            "@types/node": "^24.0.3",
            "dependency-cruiser": "^16.10.4",
            eslint: "^9.29.0",
            "eslint-plugin-sonarjs": "^3.0.3",
            knip: "^5.61.3",
            tsup: "^8.5.0",
            "typescript-eslint": "^8.34.1",
            typescript: "^5.8.3",
            vitest: "^3.2.4",
          },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "tsconfig.json",
      content: `{
  "extends": "../../tsconfig.base.json",
  "include": [
    "src",
    "test"
  ]
}
`,
    },
    {
      path: "src/app.ts",
      content: `import { createMcpApp } from "@mcp-kit/core";

import { registry } from "./mcp/registry";

export function createApp() {
  return createMcpApp({
    name: "${packageName}",
    version: "0.0.0",
    registry,
  });
}
`,
    },
    {
      path: "src/main.ts",
      content: `import { loadRuntimeConfig } from "@mcp-kit/node";

import { createApp } from "./app";
import { startHttpTransport } from "./server/transports/http";
import { startStdioTransport } from "./server/transports/stdio";

const app = createApp();
const config = loadRuntimeConfig();

if (config.transport === "http") {
  await startHttpTransport(app, {
    port: config.port,
  });
} else {
  startStdioTransport(app);
}
`,
    },
    {
      path: "src/mcp/registry.ts",
      content: `import { createCapabilityRegistry } from "@mcp-kit/core";

import { healthTool } from "../features/health";

export const registry = createCapabilityRegistry([
  healthTool,
]);
`,
    },
    {
      path: "src/server/transports/http.ts",
      content: `import { startHttpServer, type HttpServerOptions } from "@mcp-kit/node";
import type { McpApp } from "@mcp-kit/core";

export function startHttpTransport(app: McpApp, options: HttpServerOptions = {}) {
  return startHttpServer(app, options);
}
`,
    },
    {
      path: "src/server/transports/stdio.ts",
      content: `import { startStdioServer, type StdioServerOptions } from "@mcp-kit/node";
import type { McpApp } from "@mcp-kit/core";

export function startStdioTransport(app: McpApp, options: StdioServerOptions = {}) {
  return startStdioServer(app, options);
}
`,
    },
    {
      path: "src/features/health/index.ts",
      content: `export { getHealth } from "./application/get-health";
export { healthTool } from "./mcp/health.tool";
export type { HealthStatus } from "./domain/health-status";
`,
    },
    {
      path: "src/features/health/domain/health-status.ts",
      content: `export type HealthStatus = {
  readonly ok: boolean;
};
`,
    },
    {
      path: "src/features/health/application/get-health.ts",
      content: `import type { HealthStatus } from "../domain/health-status";

export function getHealth(): HealthStatus {
  return {
    ok: true,
  };
}
`,
    },
    {
      path: "src/features/health/mcp/health.tool.ts",
      content: `import { defineTool } from "@mcp-kit/core";

import { getHealth } from "../application/get-health";

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
`,
    },
    {
      path: "test/architecture/project.architecture.test.ts",
      content: `import { describe, expect, it } from "vitest";

import { registry } from "../../src/mcp/registry";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    expect(registry.capabilities.map((capability) => capability.name)).toEqual(["health_status"]);
  });
});
`,
    },
    {
      path: "test/contracts/health.contract.test.ts",
      content: `import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app";

describe("health contract", () => {
  it("returns structured health status", async () => {
    await expect(callTool(createApp(), "health_status", {})).resolves.toEqual({
      structuredContent: {
        ok: true,
      },
    });
  });
});
`,
    },
    {
      path: "test/integration/app.smoke.test.ts",
      content: `import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app";

describe("app", () => {
  it("creates an MCP app", () => {
    const app = createApp();

    expect(app.registry.get("health_status")).toBeDefined();
  });
});
`,
    },
    {
      path: "dependency-cruiser.config.cjs",
      content: `module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
  },
};
`,
    },
    {
      path: "eslint.config.js",
      content: `import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {},
  },
);
`,
    },
    {
      path: "knip.json",
      content: `{
  "entry": [
    "src/main.ts",
    "test/**/*.ts"
  ],
  "project": [
    "src/**/*.ts",
    "test/**/*.ts"
  ]
}
`,
    },
    {
      path: "vitest.config.ts",
      content: `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text"],
    },
  },
});
`,
    },
  ];
}

function parseInitArgs(args: readonly string[]): InitProjectOptions {
  const path = args[0];
  const nameFlagIndex = args.indexOf("--name");
  const name = nameFlagIndex >= 0 ? args[nameFlagIndex + 1] : undefined;

  if (!path || !name) {
    throw new Error("Usage: mcp-kit init <path> --name <name>");
  }

  return {
    path,
    name,
  };
}

async function runCommand(command: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", rejectCommand);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveCommand();
        return;
      }

      rejectCommand(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function installPreCommitHook(projectPath: string): Promise<void> {
  const gitRoot = await findGitRoot(projectPath);

  if (!gitRoot) {
    return;
  }

  const hookPath = join(gitRoot, ".git", "hooks", "pre-commit");
  const relativeProjectPath = relative(gitRoot, projectPath);
  const command = relativeProjectPath ? `cd "${relativeProjectPath}" && pnpm quality` : "pnpm quality";

  await writeFile(
    hookPath,
    `#!/bin/sh
set -e
${command}
`,
  );
  await chmod(hookPath, 0o755);
}

async function findGitRoot(startPath: string): Promise<string | undefined> {
  let currentPath = startPath;

  while (true) {
    if (await pathExists(join(currentPath, ".git"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      return undefined;
    }

    currentPath = parentPath;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function normalizePackageName(name: string): string {
  return name.trim().toLowerCase().replaceAll(/[^a-z0-9-]+/g, "-").replaceAll(/^-|-$/g, "");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}

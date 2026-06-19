import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { callTool, type Capability } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";
import { createFixtureSyncSource } from "../support/fixture-sync-source.js";

const tempDirs: string[] = [];

const toolInputs: Readonly<Record<string, unknown>> = {
  get_place: {
    id: "0009876",
  },
  get_street: {
    id: "0009876-0000123",
  },
  get_unit: {
    id: "02-01-01-1",
  },
  health_status: {},
  resolve_address: {
    query: "Boleslawiec Marszalkowska",
  },
  search_places: {
    query: "Boleslawiec",
  },
  search_streets: {
    query: "Marszalkowska",
  },
  search_units: {
    query: "dolnoslaskie",
  },
  server_status: {},
  source_status: {},
  sync_database: {
    mode: "missing",
  },
};

const toolsWithoutInputSchema = new Set(["health_status", "server_status", "source_status"]);

const invalidInputErrors: Readonly<Record<string, string>> = {
  get_place: "get_place requires id.",
  get_street: "get_street requires id.",
  get_unit: "get_unit requires id.",
  resolve_address: "resolve_address requires query.",
  search_places: "search_places requires query.",
  search_streets: "search_streets requires query.",
  search_units: "search_units requires query.",
  sync_database: "sync_database requires mode: missing | stale | force.",
};

afterEach(async () => {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        force: true,
        recursive: true,
      }),
    ),
  );
  tempDirs.length = 0;
});

describe("public capability contracts", () => {
  it("covers every public capability", async () => {
    const app = createContractApp(await createTempDir());

    expect(app.registry.capabilities.map((capability) => capability.name)).toEqual(Object.keys(toolInputs));
  });

  it("defines stable input schemas, output schemas, and annotations", async () => {
    const app = createContractApp(await createTempDir());

    for (const tool of app.registry.tools()) {
      expect(tool.outputSchema, tool.name).toBeDefined();
      expect(tool.returnsStructuredContent, tool.name).toBe(true);

      if (toolsWithoutInputSchema.has(tool.name)) {
        expect(tool.inputSchema, tool.name).toBeUndefined();
      } else {
        expect(tool.inputSchema, tool.name).toMatchObject({
          type: "object",
        });
      }

      expectAnnotations(tool);
    }
  });

  it("returns structured content for every public tool", async () => {
    const app = createContractApp(await createTempDir());

    for (const [toolName, input] of Object.entries(toolInputs)) {
      const result = await callTool(app, toolName, input);

      expect(result, toolName).toHaveProperty("structuredContent");
      expect(result.structuredContent, toolName).toBeDefined();
    }
  });

  it("returns stable errors for invalid public tool input", async () => {
    const app = createContractApp(await createTempDir());

    for (const [toolName, message] of Object.entries(invalidInputErrors)) {
      await expect(callTool(app, toolName, {}), toolName).rejects.toMatchObject({
        message,
        name: "Error",
      });
    }
  });
});

function expectAnnotations(tool: Capability): void {
  if (tool.policy === "read") {
    expect(tool.annotations, tool.name).toMatchObject({
      readOnlyHint: true,
    });
    return;
  }

  expect(tool.annotations, tool.name).toMatchObject({
    destructiveHint: false,
    readOnlyHint: false,
  });
}

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "teryt-capability-contracts-"));
  tempDirs.push(path);
  return path;
}

function createContractApp(dataDir: string) {
  return createApp(
    {
      dataDir,
      port: 3000,
      transport: "stdio",
    },
    {
      syncSource: createFixtureSyncSource(),
    },
  );
}

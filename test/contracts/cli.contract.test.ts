import { Writable } from "node:stream";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../../src/app.js";
import { runCli } from "../../src/cli.js";
import { createFixtureSyncSource } from "../support/fixture-sync-source.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";
import { createTestSourceCatalog } from "../support/test-source-catalog.js";

const tempDirs: string[] = [];

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

describe("teryt-mcp CLI contract", () => {
  it("prints help", async () => {
    const stdout = new MemoryWritable();

    await runCli(["--help"], {
      env: {},
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(stdout.content).toContain("Usage:");
    expect(stdout.content).toContain("teryt-mcp about");
    expect(stdout.content).toContain("teryt-mcp serve");
  });

  it("returns about information consistent with MCP", async () => {
    const stdout = new MemoryWritable();
    const env = {
      MCP_DATA_DIR: "test-data/teryt-cli",
      MCP_TRANSPORT: "stdio",
    };
    const config = createTestRuntimeConfig({
      dataDir: resolve(env.MCP_DATA_DIR),
    });
    const mcpResult = await callTool(createApp(config), "about", {});

    await runCli(["about"], {
      env,
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toEqual(mcpResult.structuredContent);
  });

  it("returns server status consistent with MCP", async () => {
    const stdout = new MemoryWritable();
    const env = {
      MCP_DATA_DIR: "test-data/teryt-cli",
      MCP_TRANSPORT: "http",
      PORT: "3010",
    };
    const config = createTestRuntimeConfig({
      dataDir: resolve(env.MCP_DATA_DIR),
      port: 3010,
      transport: "http",
    });
    const mcpResult = await callTool(createApp(config), "server_status", {});

    await runCli(["status"], {
      env,
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toEqual(mcpResult.structuredContent);
  });

  it("returns source status consistent with MCP", async () => {
    const stdout = new MemoryWritable();
    const env = {
      MCP_DATA_DIR: "test-data/teryt-cli",
      MCP_TRANSPORT: "stdio",
      PORT: "3010",
    };
    const config = createTestRuntimeConfig({
      dataDir: resolve(env.MCP_DATA_DIR),
      port: 3010,
    });
    const appFactory = (runtimeConfig: Parameters<typeof createApp>[0]) =>
      createApp(runtimeConfig, { sourceCatalog: createTestSourceCatalog() });
    const mcpResult = await callTool(appFactory(config), "source_status", {});

    await runCli(["source-status"], {
      appFactory,
      env,
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toEqual(mcpResult.structuredContent);
  });

  it("runs database sync in force mode", async () => {
    const stdout = new MemoryWritable();
    const dataDir = await createTempDir();

    await runCli(["sync", "--force"], {
      appFactory: (config) =>
        createApp(config, {
          syncSource: createFixtureSyncSource(),
        }),
      env: {
        MCP_DATA_DIR: dataDir,
        MCP_TRANSPORT: "stdio",
      },
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toMatchObject({
      databasePath: join(dataDir, "teryt.sqlite"),
      datasets: [
        {
          dataset: "TERC",
          stateDate: "2026-01-01",
        },
        {
          dataset: "SIMC",
          stateDate: "2026-01-01",
        },
        {
          dataset: "ULIC",
          stateDate: "2026-01-01",
        },
        {
          dataset: "WMRODZ",
          stateDate: "2026-01-01",
        },
      ],
      mode: "force",
      status: "synced",
    });
    await expect(stat(join(dataDir, "teryt.sqlite"))).resolves.toBeDefined();
  });

  it("returns place search results consistent with MCP", async () => {
    const stdout = new MemoryWritable();
    const dataDir = await createTempDir();
    const env = {
      MCP_DATA_DIR: dataDir,
      MCP_TRANSPORT: "stdio",
      PORT: "3010",
    };
    const config = createTestRuntimeConfig({
      dataDir,
      port: 3010,
    });
    const appFactory = (runtimeConfig: Parameters<typeof createApp>[0]) =>
      createApp(runtimeConfig, { syncSource: createFixtureSyncSource() });
    const app = appFactory(config);
    await callTool(app, "sync_database", { mode: "force" });
    const mcpResult = await callTool(app, "search_places", {
      query: "Kraków",
    });

    await runCli(["search", "places", "Kraków"], {
      appFactory,
      env,
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toEqual(mcpResult.structuredContent);
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "teryt-cli-"));
  tempDirs.push(path);
  return path;
}

class MemoryWritable extends Writable {
  readonly chunks: string[] = [];

  get content(): string {
    return this.chunks.join("");
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString("utf8"));
    callback();
  }
}

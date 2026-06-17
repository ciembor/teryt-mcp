import { Writable } from "node:stream";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";
import { runCli } from "../../src/cli.js";

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
  it("returns server status consistent with MCP", async () => {
    const stdout = new MemoryWritable();
    const env = {
      MCP_DATA_DIR: "test-data/teryt-cli",
      MCP_TRANSPORT: "http",
      PORT: "3010",
    };
    const config = {
      dataDir: resolve(env.MCP_DATA_DIR),
      port: 3010,
      transport: "http" as const,
    };
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
    const config = {
      dataDir: resolve(env.MCP_DATA_DIR),
      port: 3010,
      transport: "stdio" as const,
    };
    const mcpResult = await callTool(createApp(config), "source_status", {});

    await runCli(["source-status"], {
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
          stateDate: "unknown",
        },
        {
          dataset: "SIMC",
          stateDate: "unknown",
        },
        {
          dataset: "ULIC",
          stateDate: "unknown",
        },
        {
          dataset: "WMRODZ",
          stateDate: "unknown",
        },
      ],
      mode: "force",
      status: "synced",
    });
    await expect(stat(join(dataDir, "teryt.sqlite"))).resolves.toBeDefined();
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

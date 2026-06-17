import { Writable } from "node:stream";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-kit/core";

import { createApp } from "../../src/app.js";
import { runCli } from "../../src/cli.js";

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
});

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

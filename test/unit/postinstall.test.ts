import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createCapabilityRegistry, createMcpApp, defineTool, type McpApp } from "@mcp-craftsman/core";
import type { RuntimeConfig } from "@mcp-craftsman/node";

import { runPostinstallSync } from "../../src/postinstall.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

describe("postinstall sync", () => {
  it("runs missing sync using the TERYT data directory", async () => {
    const calls: Array<{ readonly config: RuntimeConfig; readonly input: unknown }> = [];
    const stderr = new MemoryWritable();

    await runPostinstallSync({
      appFactory: (config = defaultConfig()) => createSyncCaptureApp(config, calls),
      io: {
        env: {
          MCP_DATA_DIR: "install-data",
        },
        stderr,
      },
    });

    expect(calls).toEqual([
      {
        config: {
          configDir: expect.any(String) as string,
          dataDir: expect.stringContaining("install-data") as string,
          logLevel: "info",
          port: 3000,
          transport: "stdio",
        },
        input: {
          mode: "missing",
        },
      },
    ]);
    expect(stderr.content).toContain("████████╗███████╗██████╗");
    expect(stderr.content).toContain("teryt-mcp 0.1.10");
    expect(stderr.content).toContain("Author: Maciej Ciemborowicz <maciej.ciemborowicz@gmail.com>");
    expect(stderr.content).toContain("Repository: https://github.com/ciembor/teryt-mcp");
    expect(stderr.content).toContain("Data sync: ✓ downloaded and synchronized.");
    expect(stderr.content).toContain("TERYT data state dates:");
    expect(stderr.content).toContain("  - TERC: 2026-01-01");
  });

  it("can skip install-time sync", async () => {
    const calls: unknown[] = [];
    const stderr = new MemoryWritable();

    await runPostinstallSync({
      appFactory: (config = defaultConfig()) => createSyncCaptureApp(config, calls),
      io: {
        env: {
          TERYT_MCP_SKIP_POSTINSTALL_SYNC: "1",
        },
        stderr,
      },
    });

    expect(calls).toEqual([]);
    expect(stderr.content).toContain("teryt-mcp 0.1.10");
    expect(stderr.content).toContain("Data sync: skipped by TERYT_MCP_SKIP_POSTINSTALL_SYNC.");
  });
});

function createSyncCaptureApp(config: RuntimeConfig, calls: unknown[]): McpApp {
  return createMcpApp({
    name: "test",
    version: "0.0.0",
    registry: createCapabilityRegistry([
      defineTool({
        name: "sync_database",
        policy: "write",
        handler: (input) => {
          calls.push({
            config,
            input,
          });

          return {
            structuredContent: {
              datasets: [
                {
                  dataset: "TERC",
                  stateDate: "2026-01-01",
                },
              ],
              status: "synced",
            },
          };
        },
      }),
    ]),
  });
}

function defaultConfig(): RuntimeConfig {
  return createTestRuntimeConfig({
    dataDir: "test-data",
  });
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

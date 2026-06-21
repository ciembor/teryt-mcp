import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger, startHttpServer, startStdioServer } from "@mcp-craftsman/node";

import { createApp } from "../../src/app.js";
import { createTestRuntimeConfig } from "../support/runtime-config.js";

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

describe("transport roundtrip", () => {
  it("calls a TERYT tool over stdio", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on("data", (chunk) => {
      chunks.push(chunk.toString());
    });

    const stdio = await startStdioServer(createTerytApp(), {
      input,
      output,
      logger: createSilentLogger(),
    });

    input.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          capabilities: {},
          clientInfo: {
            name: "teryt-test-client",
            version: "1.0.0",
          },
          protocolVersion: "2025-03-26",
        },
      })}\n`,
    );
    await waitForJsonLines(chunks, 1);
    input.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
    input.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      })}\n`,
    );
    await waitForJsonLines(chunks, 2);
    input.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          arguments: {},
          name: "health_status",
        },
      })}\n`,
    );
    await waitForJsonLines(chunks, 3);
    await stdio.close();

    const [initialize, list, call] = chunks.join("").trim().split("\n").map((line) => JSON.parse(line));
    expect(initialize).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        capabilities: { tools: {} },
        serverInfo: { name: "teryt-mcp" },
      },
    });
    expect(list.result.tools).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "health_status" })]),
    );
    expect(call).toEqual({
      jsonrpc: "2.0",
      id: 3,
      result: {
        content: [],
        structuredContent: {
          ok: true,
        },
      },
    });
  });

  it("calls a TERYT tool over HTTP", async () => {
    const http = await startHttpServer(createTerytApp(), {
      port: 0,
    });

    try {
      const response = await fetch(`${http.url}/tools/health_status`, {
        body: JSON.stringify({}),
        method: "POST",
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        structuredContent: {
          ok: true,
        },
      });
    } finally {
      await http.close();
    }
  });
});

function createSilentLogger() {
  return createLogger(new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  }));
}

function createTerytApp() {
  return createApp(createTestRuntimeConfig({
    dataDir: createTempDirSync(),
  }));
}

function createTempDirSync(): string {
  const path = mkdtempSync(join(tmpdir(), "teryt-transport-roundtrip-"));
  tempDirs.push(path);
  return path;
}

async function waitForJsonLines(chunks: string[], count: number): Promise<void> {
  await vi.waitFor(() => {
    expect(chunks.join("").trim().split("\n").filter(Boolean)).toHaveLength(count);
  });
}

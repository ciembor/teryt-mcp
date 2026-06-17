import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestApp, defineTool } from "@mcp-kit/core";

import {
  atomicWrite,
  createLogger,
  loadRuntimeConfig,
  resolveDataDir,
  startHttpServer,
  startStdioServer,
  withLock,
} from "../../src/index.js";

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

describe("@mcp-kit/node", () => {
  it("loads runtime config from environment", () => {
    expect(
      loadRuntimeConfig({
        MCP_TRANSPORT: "http",
        MCP_PORT: "8787",
        MCP_DATA_DIR: "/tmp/teryt-mcp",
      }),
    ).toEqual({
      transport: "http",
      port: 8787,
      dataDir: "/tmp/teryt-mcp",
    });
  });

  it("resolves default data directory under XDG cache", () => {
    expect(
      resolveDataDir({
        XDG_CACHE_HOME: "/tmp/cache",
      }),
    ).toBe("/tmp/cache/mcp-kit");
  });

  it("writes logger output to the provided stream", () => {
    const writes: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        writes.push(chunk.toString());
        callback();
      },
    });

    createLogger(stream).info("server started", {
      transport: "stdio",
    });

    expect(writes).toEqual(['[info] server started {"transport":"stdio"}\n']);
  });

  it("starts an HTTP adapter that calls registered tools", async () => {
    const app = createTestApp([
      defineTool<{ value: string }, { value: string }>({
        name: "echo_value",
        policy: "read",
        outputSchema: {
          type: "object",
          properties: {
            value: {
              type: "string",
            },
          },
          required: ["value"],
        },
        returnsStructuredContent: true,
        annotations: {
          readOnlyHint: true,
        },
        handler: (input) => ({
          structuredContent: {
            value: input.value,
          },
        }),
      }),
    ]);
    const http = await startHttpServer(app, {
      port: 0,
    });

    try {
      const response = await fetch(`${http.url}/tools/echo_value`, {
        method: "POST",
        body: JSON.stringify({
          value: "TERYT",
        }),
      });

      await expect(response.json()).resolves.toEqual({
        structuredContent: {
          value: "TERYT",
        },
      });
    } finally {
      await http.close();
    }
  });

  it("starts a stdio adapter that handles JSON tool calls", async () => {
    const app = createTestApp([
      defineTool<{ value: string }, { value: string }>({
        name: "echo_value",
        policy: "read",
        outputSchema: {
          type: "object",
          properties: {
            value: {
              type: "string",
            },
          },
          required: ["value"],
        },
        returnsStructuredContent: true,
        annotations: {
          readOnlyHint: true,
        },
        handler: (input) => ({
          structuredContent: {
            value: input.value,
          },
        }),
      }),
    ]);
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on("data", (chunk) => {
      chunks.push(chunk.toString());
    });

    const stdio = startStdioServer(app, {
      input,
      output,
      logger: createLogger(new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      })),
    });

    input.write(
      `${JSON.stringify({
        id: 1,
        method: "tools/call",
        params: {
          name: "echo_value",
          input: {
            value: "SIMC",
          },
        },
      })}\n`,
    );

    await vi.waitFor(() => {
      expect(chunks.join("")).toContain('"SIMC"');
    });
    stdio.close();

    expect(JSON.parse(chunks.join(""))).toEqual({
      id: 1,
      result: {
        structuredContent: {
          value: "SIMC",
        },
      },
    });
  });

  it("writes files atomically and creates parent directories", async () => {
    const directory = await createTempDir();
    const path = join(directory, "nested", "manifest.json");

    await atomicWrite(path, JSON.stringify({ ok: true }));

    await expect(readFile(path, "utf8")).resolves.toBe('{"ok":true}');
  });

  it("runs a callback under a filesystem lock", async () => {
    const directory = await createTempDir();
    const lockPath = join(directory, "sync.lock");
    const calls: string[] = [];

    const result = await withLock(lockPath, () => {
      calls.push("locked");
      return 42;
    });

    expect(result).toBe(42);
    expect(calls).toEqual(["locked"]);
    await expect(readFile(lockPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-kit-node-"));
  tempDirs.push(path);
  return path;
}

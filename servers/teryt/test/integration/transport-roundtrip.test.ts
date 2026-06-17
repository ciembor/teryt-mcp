import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger, startHttpServer, startStdioServer } from "@mcp-kit/node";

import { createApp } from "../../src/app.js";

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

    const stdio = startStdioServer(createTerytApp(), {
      input,
      output,
      logger: createSilentLogger(),
    });

    input.write(
      `${JSON.stringify({
        id: 1,
        method: "tools/call",
        params: {
          input: {},
          name: "health_status",
        },
      })}\n`,
    );

    await vi.waitFor(() => {
      expect(chunks.join("")).toContain('"ok":true');
    });
    stdio.close();

    expect(JSON.parse(chunks.join(""))).toEqual({
      id: 1,
      result: {
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
  return createApp({
    dataDir: createTempDirSync(),
    port: 3000,
    transport: "stdio",
  });
}

function createTempDirSync(): string {
  const path = mkdtempSync(join(tmpdir(), "teryt-transport-roundtrip-"));
  tempDirs.push(path);
  return path;
}

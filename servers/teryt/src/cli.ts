#!/usr/bin/env node
import { basename } from "node:path";

import { loadRuntimeConfig } from "@mcp-kit/node";
import { callTool, mcpKitCoreVersion } from "@mcp-kit/core";

import { createApp } from "./app.js";
import { getServerStatus } from "./features/server-status/index.js";
import { serve } from "./server/serve.js";

type CliIo = {
  readonly env: NodeJS.ProcessEnv;
  readonly stderr: NodeJS.WritableStream;
  readonly stdout: NodeJS.WritableStream;
};

export async function runCli(argv: readonly string[] = process.argv.slice(2), io: CliIo = defaultIo()): Promise<void> {
  const [command, ...args] = argv;

  if (command === "serve") {
    await serve(loadRuntimeConfig(io.env));
    return;
  }

  if (command === "status") {
    const config = loadRuntimeConfig(io.env);

    writeJson(
      io.stdout,
      getServerStatus({
        dataDir: config.dataDir,
        frameworkVersion: mcpKitCoreVersion,
        transport: config.transport,
      }),
    );
    return;
  }

  if (command === "source-status") {
    await writeCliToolResult(io.stdout, "source_status", {}, io.env);
    return;
  }

  if (command === "sync") {
    await writeCliToolResult(io.stdout, "sync_database", { mode: parseSyncMode(args) }, io.env);
    return;
  }

  if (command === "search") {
    await runSearchCommand(args, io);
    return;
  }

  throw new Error(`Unknown command: ${command ?? "<missing>"}`);
}

function writeJson(stream: NodeJS.WritableStream, value: unknown): void {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function writeCliToolResult(
  stream: NodeJS.WritableStream,
  toolName: string,
  input: unknown,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const result = await callTool(createApp(loadRuntimeConfig(env)), toolName, input);

  writeJson(stream, result.structuredContent);
}

function defaultIo(): CliIo {
  return {
    env: process.env,
    stderr: process.stderr,
    stdout: process.stdout,
  };
}

async function runSearchCommand(args: readonly string[], io: CliIo): Promise<void> {
  const [scope, ...queryParts] = args;

  if (scope !== "places") {
    throw new Error("search requires scope: places.");
  }

  const { limit, query } = parseSearchArgs(queryParts);

  await writeCliToolResult(
    io.stdout,
    "search_places",
    {
      limit,
      query,
    },
    io.env,
  );
}

function parseSearchArgs(args: readonly string[]): { readonly limit?: number; readonly query: string } {
  const queryParts: string[] = [];
  let limit: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === "--limit") {
      limit = parseLimit(args[index + 1]);
      index += 1;
      continue;
    }

    queryParts.push(value ?? "");
  }

  const query = queryParts.join(" ").trim();

  if (!query) {
    throw new Error("search places requires query.");
  }

  return limit === undefined ? { query } : { limit, query };
}

function parseLimit(value: string | undefined): number {
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("search --limit requires a positive integer.");
  }

  return limit;
}

function parseSyncMode(args: readonly string[]): "missing" | "stale" | "force" {
  if (args.includes("--force")) {
    return "force";
  }

  const modeIndex = args.indexOf("--mode");

  if (modeIndex >= 0) {
    const mode = args[modeIndex + 1];

    if (mode === "missing" || mode === "stale" || mode === "force") {
      return mode;
    }

    throw new Error("sync --mode requires: missing | stale | force.");
  }

  return "missing";
}

function isCliEntrypoint(argvPath: string | undefined = process.argv[1]): boolean {
  const entrypoint = argvPath ? basename(argvPath) : "";

  return entrypoint === "teryt-mcp" || entrypoint === "cli.js";
}

if (isCliEntrypoint()) {
  runCli().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

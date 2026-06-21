#!/usr/bin/env node
import {
  createDefaultCliIo,
  isCliEntrypoint,
  writeCliToolStructuredContent,
  writeJson,
  type CliIo,
} from "@mcp-craftsman/node";
import { mcpCraftsmanCoreVersion } from "@mcp-craftsman/core";

import { createApp } from "./app.js";
import { getServerStatus } from "./features/server-status/index.js";
import { JsonManifestStore } from "./features/source-status/infrastructure/json-manifest-store.js";
import { loadTerytRuntimeConfig } from "./runtime/config.js";
import { serve } from "./server/serve.js";

type TerytCliIo = CliIo & {
  readonly appFactory?: typeof createApp;
};

export async function runCli(argv: readonly string[] = process.argv.slice(2), io: TerytCliIo = defaultIo()): Promise<void> {
  const [command, ...args] = argv;

  if (command === "serve") {
    await serve(loadTerytRuntimeConfig(io.env));
    return;
  }

  if (command === "status") {
    const config = loadTerytRuntimeConfig(io.env);

    writeJson(
      io.stdout,
      await getServerStatus({
        dataDir: config.dataDir,
        databaseExists: () => new JsonManifestStore(config.dataDir).hasDatabase(),
        frameworkVersion: mcpCraftsmanCoreVersion,
        transport: config.transport,
      }),
    );
    return;
  }

  if (command === "source-status") {
    await writeCliToolResult(io.stdout, "source_status", {}, io);
    return;
  }

  if (command === "sync") {
    await writeCliToolResult(io.stdout, "sync_database", { mode: parseSyncMode(args) }, io);
    return;
  }

  if (command === "search") {
    await runSearchCommand(args, io);
    return;
  }

  throw new Error(`Unknown command: ${command ?? "<missing>"}`);
}

async function writeCliToolResult(
  stream: NodeJS.WritableStream,
  toolName: string,
  input: unknown,
  io: TerytCliIo,
): Promise<void> {
  await writeCliToolStructuredContent(stream, io.appFactory ?? createApp, toolName, input, {
    ...io.env,
    MCP_DATA_DIR: loadTerytRuntimeConfig(io.env).dataDir,
  });
}

function defaultIo(): TerytCliIo {
  return createDefaultCliIo();
}

async function runSearchCommand(args: readonly string[], io: TerytCliIo): Promise<void> {
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
    io,
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

if (isCliEntrypoint("teryt-mcp")) {
  runCli().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

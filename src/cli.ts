#!/usr/bin/env node
import { callTool } from "@mcp-craftsman/core";
import {
  createDefaultCliIo,
  createMcpCli,
  isCliEntrypoint,
  writeJson,
  type CliIo,
  type McpCliCommand,
  type McpCliCommandContext,
} from "@mcp-craftsman/node";

import { createApp } from "./app.js";
import { writeAbout } from "./cli-about.js";
import { helpText } from "./cli-help.js";

type TerytCliIo = CliIo & {
  readonly appFactory?: typeof createApp;
};

export async function runCli(argv: readonly string[] = process.argv.slice(2), io: TerytCliIo = defaultIo()): Promise<void> {
  const cli = createMcpCli({
    appName: "teryt-mcp",
    commands: createCommands(),
    createApp: io.appFactory ?? createApp,
  });

  await cli.run(normalizeArgv(argv), io);
}

function createCommands(): readonly McpCliCommand[] {
  return [
    {
      name: "about",
      run: ({ app, config, io }) => writeAbout(app, config.dataDir, io.stdout),
    },
    {
      name: "help",
      run: ({ io }) => {
        io.stdout.write(helpText);
      },
    },
    {
      name: "search",
      run: (context) => runSearchCommand(context),
    },
    toolCommand("source-status", "source_status", () => ({})),
    toolCommand("status", "server_status", () => ({})),
    toolCommand("sync", "sync_database", parseSyncInput),
  ];
}

function toolCommand(
  name: string,
  toolName: string,
  readInput: (args: readonly string[]) => unknown,
): McpCliCommand {
  return {
    name,
    run: async ({ app, args, io }) => {
      const result = await callTool(app, toolName, readInput(args));
      writeJson(io.stdout, result.structuredContent);
    },
  };
}

async function runSearchCommand(context: McpCliCommandContext): Promise<void> {
  const [scope, ...queryParts] = context.args;

  if (scope !== "places") {
    throw new Error("search requires scope: places.");
  }

  const result = await callTool(context.app, "search_places", parseSearchArgs(queryParts));
  writeJson(context.io.stdout, result.structuredContent);
}

function normalizeArgv(argv: readonly string[]): readonly string[] {
  return argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" ? ["help"] : argv;
}

function defaultIo(): TerytCliIo {
  return createDefaultCliIo();
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

function parseSyncInput(args: readonly string[]): { readonly mode: "missing" | "stale" | "force" } {
  return { mode: parseSyncMode(args) };
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

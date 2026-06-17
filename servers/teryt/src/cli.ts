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
  const [command] = argv;

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

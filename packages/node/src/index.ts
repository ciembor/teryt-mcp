import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import { Readable, Writable } from "node:stream";
import { mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { callTool, type McpApp } from "@mcp-kit/core";

export type RuntimeConfig = {
  readonly transport: "stdio" | "http";
  readonly port: number;
  readonly dataDir: string;
};

export type Logger = {
  readonly debug: (message: string, metadata?: unknown) => void;
  readonly info: (message: string, metadata?: unknown) => void;
  readonly warn: (message: string, metadata?: unknown) => void;
  readonly error: (message: string, metadata?: unknown) => void;
};

export type StdioServer = {
  readonly close: () => void;
};

export type StdioServerOptions = {
  readonly input?: Readable;
  readonly output?: Writable;
  readonly logger?: Logger;
};

export type HttpServerOptions = {
  readonly port?: number;
  readonly hostname?: string;
  readonly logger?: Logger;
};

export type StartedHttpServer = {
  readonly server: Server;
  readonly port: number;
  readonly url: string;
  readonly close: () => Promise<void>;
};

type JsonRpcRequest = {
  readonly id?: string | number | null;
  readonly method?: string;
  readonly params?: {
    readonly name?: string;
    readonly input?: unknown;
  };
};

export function startStdioServer(app: McpApp, options: StdioServerOptions = {}): StdioServer {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const logger = options.logger ?? createLogger();
  const lines = createInterface({
    input,
    terminal: false,
  });

  lines.on("line", (line) => {
    void handleStdioLine(app, line, output, logger);
  });

  return {
    close: () => {
      lines.close();
    },
  };
}

export async function startHttpServer(app: McpApp, options: HttpServerOptions = {}): Promise<StartedHttpServer> {
  const logger = options.logger ?? createLogger();
  const hostname = options.hostname ?? "127.0.0.1";
  const configuredPort = options.port ?? loadRuntimeConfig().port;
  const server = createServer((request, response) => {
    void handleHttpRequest(app, request, response, logger);
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(configuredPort, hostname, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : configuredPort;

  return {
    server,
    port,
    url: `http://${hostname}:${port}`,
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      }),
  };
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return {
    transport: env.MCP_TRANSPORT === "http" ? "http" : "stdio",
    port: parsePort(env.PORT ?? env.MCP_PORT),
    dataDir: resolveDataDir(env),
  };
}

export function createLogger(stream: NodeJS.WritableStream = process.stderr): Logger {
  const write = (level: string, message: string, metadata?: unknown): void => {
    const suffix = metadata === undefined ? "" : ` ${JSON.stringify(metadata)}`;
    stream.write(`[${level}] ${message}${suffix}\n`);
  };

  return {
    debug: (message, metadata) => write("debug", message, metadata),
    info: (message, metadata) => write("info", message, metadata),
    warn: (message, metadata) => write("warn", message, metadata),
    error: (message, metadata) => write("error", message, metadata),
  };
}

export function resolveDataDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MCP_DATA_DIR) {
    return resolve(env.MCP_DATA_DIR);
  }

  if (env.XDG_CACHE_HOME) {
    return resolve(env.XDG_CACHE_HOME, "mcp-kit");
  }

  return resolve(process.cwd(), ".cache", "mcp-kit");
}

export async function atomicWrite(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), {
    recursive: true,
  });

  const temporaryPath = join(dirname(path), `.${process.pid}.${Date.now()}.${randomUUID()}.tmp`);

  try {
    await writeFile(temporaryPath, data);
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, {
      force: true,
    });
    throw error;
  }
}

export async function withLock<T>(
  lockPath: string,
  callback: () => T | Promise<T>,
  options: { readonly retries?: number; readonly retryDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 20;
  const retryDelayMs = options.retryDelayMs ?? 50;

  await mkdir(dirname(lockPath), {
    recursive: true,
  });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");

      try {
        return await callback();
      } finally {
        await handle.close();
        await rm(lockPath, {
          force: true,
        });
      }
    } catch (error) {
      if (!isFileExistsError(error) || attempt === retries) {
        throw error;
      }

      await delay(retryDelayMs);
    }
  }

  throw new Error(`Could not acquire lock: ${lockPath}`);
}

async function handleStdioLine(app: McpApp, line: string, output: Writable, logger: Logger): Promise<void> {
  try {
    const request = JSON.parse(line) as JsonRpcRequest;
    const result = await routeJsonRpc(app, request);

    output.write(`${JSON.stringify({ id: request.id ?? null, result })}\n`);
  } catch (error) {
    logger.error("stdio request failed", serializeError(error));
    output.write(`${JSON.stringify({ id: null, error: serializeError(error) })}\n`);
  }
}

async function handleHttpRequest(
  app: McpApp,
  request: IncomingMessage,
  response: ServerResponse,
  logger: Logger,
): Promise<void> {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, {
        ok: true,
        name: app.name,
        version: app.version,
      });
      return;
    }

    if (request.method === "POST" && request.url?.startsWith("/tools/")) {
      const toolName = decodeURIComponent(request.url.slice("/tools/".length));
      const input = await readJsonBody(request);
      const result = await callTool(app, toolName, input);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, {
      error: "not_found",
    });
  } catch (error) {
    logger.error("http request failed", serializeError(error));
    sendJson(response, 500, {
      error: serializeError(error),
    });
  }
}

async function routeJsonRpc(app: McpApp, request: JsonRpcRequest): Promise<unknown> {
  if (request.method !== "tools/call") {
    throw new Error(`Unsupported method: ${request.method ?? "<missing>"}`);
  }

  if (!request.params?.name) {
    throw new Error("Tool call requires params.name.");
  }

  return callTool(app, request.params.name, request.params.input);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function parsePort(value: string | undefined): number {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

function isFileExistsError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function serializeError(error: unknown): { readonly message: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
}

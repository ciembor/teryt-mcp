import { callTool, type McpApp } from "@mcp-craftsman/core";
import { isCliEntrypoint } from "@mcp-craftsman/node";

import { createApp } from "./app.js";
import { loadTerytRuntimeConfig } from "./runtime/config.js";
import { terytMcpVersion } from "./version.js";

type PostinstallIo = {
  readonly env: NodeJS.ProcessEnv;
  readonly stderr: NodeJS.WritableStream;
};

type PostinstallOptions = {
  readonly appFactory?: typeof createApp;
  readonly io?: PostinstallIo;
};

const skipValues = new Set(["1", "true", "yes"]);
const author = "Maciej Ciemborowicz";
const authorEmail = "maciej.ciemborowicz@gmail.com";
const repositoryUrl = "https://github.com/ciembor/teryt-mcp";
const banner = String.raw`
████████╗███████╗██████╗ ██╗   ██╗████████╗   ███╗   ███╗ ██████╗██████╗
╚══██╔══╝██╔════╝██╔══██╗╚██╗ ██╔╝╚══██╔══╝   ████╗ ████║██╔════╝██╔══██╗
   ██║   █████╗  ██████╔╝ ╚████╔╝    ██║█████╗██╔████╔██║██║     ██████╔╝
   ██║   ██╔══╝  ██╔══██╗  ╚██╔╝     ██║╚════╝██║╚██╔╝██║██║     ██╔═══╝
   ██║   ███████╗██║  ██║   ██║      ██║      ██║ ╚═╝ ██║╚██████╗██║
   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝      ╚═╝     ╚═╝ ╚═════╝╚═╝
`;

export async function runPostinstallSync(options: PostinstallOptions = {}): Promise<void> {
  const io = options.io ?? {
    env: process.env,
    stderr: process.stderr,
  };

  writeInstallHeader(io.stderr);

  if (skipValues.has((io.env.TERYT_MCP_SKIP_POSTINSTALL_SYNC ?? "").toLowerCase())) {
    io.stderr.write("Data sync: skipped by TERYT_MCP_SKIP_POSTINSTALL_SYNC.\n");
    return;
  }

  const config = loadTerytRuntimeConfig(io.env);
  const appFactory = options.appFactory ?? createApp;
  const result = await callTool(appFactory(config) as McpApp, "sync_database", {
    mode: "missing",
  });
  const summary = readSyncSummary(result.structuredContent);

  io.stderr.write(formatSyncSummary(summary, config.dataDir));
}

function writeInstallHeader(stream: NodeJS.WritableStream): void {
  stream.write(`${banner}\n`);
  stream.write(`teryt-mcp ${terytMcpVersion}\n`);
  stream.write(`Author: ${author} <${authorEmail}>\n`);
  stream.write(`Repository: ${repositoryUrl}\n\n`);
}

type SyncSummary = {
  readonly datasets: readonly DatasetSummary[];
  readonly status: string;
};

type DatasetSummary = {
  readonly dataset: string;
  readonly stateDate: string;
};

function readSyncSummary(content: unknown): SyncSummary {
  if (typeof content === "object" && content !== null && "status" in content && typeof content.status === "string") {
    return {
      datasets: readDatasets(content),
      status: content.status,
    };
  }

  return {
    datasets: [],
    status: "completed",
  };
}

function readDatasets(content: object): readonly DatasetSummary[] {
  if (!("datasets" in content) || !Array.isArray(content.datasets)) {
    return [];
  }

  return content.datasets.flatMap((item) => {
    if (isDatasetSummary(item)) {
      return [{ dataset: item.dataset, stateDate: item.stateDate }];
    }

    return [];
  });
}

function isDatasetSummary(item: unknown): item is DatasetSummary {
  return isRecord(item) && hasStringField(item, "dataset") && hasStringField(item, "stateDate");
}

function isRecord(item: unknown): item is Record<string, unknown> {
  return typeof item === "object" && item !== null;
}

function hasStringField(item: Record<string, unknown>, field: string): boolean {
  return typeof item[field] === "string";
}

function formatSyncSummary(summary: SyncSummary, dataDir: string): string {
  const lines = [
    `Data sync: ${formatStatus(summary.status)}.`,
    `Data directory: ${dataDir}`,
  ];

  if (summary.datasets.length > 0) {
    lines.push("TERYT data state dates:");
    lines.push(...summary.datasets.map((item) => `  - ${item.dataset}: ${item.stateDate}`));
  } else if (summary.status === "skipped") {
    lines.push("TERYT data: already available; no download needed.");
  } else {
    lines.push("TERYT data state dates: unavailable.");
  }

  return `${lines.join("\n")}\n`;
}

function formatStatus(status: string): string {
  if (status === "synced") {
    return "✓ downloaded and synchronized";
  }

  if (status === "skipped") {
    return "✓ already synchronized";
  }

  return status;
}

if (isCliEntrypoint("postinstall.js")) {
  runPostinstallSync().catch((error: unknown) => {
    process.stderr.write(`Data sync: ✗ failed: ${error instanceof Error ? error.message : String(error)}\n`);
  });
}

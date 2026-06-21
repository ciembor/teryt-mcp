import { callTool, type McpApp } from "@mcp-craftsman/core";
import type { CliIo } from "@mcp-craftsman/node";

import { createApp } from "./app.js";
import { formatDataSummary, formatHeader } from "./cli-output.js";
import { loadTerytRuntimeConfig } from "./runtime/config.js";

type AboutIo = CliIo & {
  readonly appFactory?: typeof createApp;
};

type AboutContent = {
  readonly author: { readonly name: string };
  readonly contact: { readonly email: string };
  readonly data: {
    readonly datasets: readonly { readonly dataset: string; readonly stateDate: string }[];
    readonly synchronizedSuccessfully: boolean;
  };
  readonly repository: { readonly url: string };
  readonly server: { readonly name: string; readonly version: string };
};

export async function writeAbout(io: AboutIo): Promise<void> {
  const config = loadTerytRuntimeConfig(io.env);
  const result = await callTool((io.appFactory ?? createApp)(config) as McpApp, "about", {});
  const about = result.structuredContent as AboutContent;

  io.stdout.write(formatHeader({
    authorEmail: about.contact.email,
    authorName: about.author.name,
    repositoryUrl: about.repository.url,
    serverName: about.server.name,
    serverVersion: about.server.version,
  }));
  io.stdout.write(formatDataSummary({
    dataDir: config.dataDir,
    datasets: about.data.datasets,
    status: about.data.synchronizedSuccessfully ? "✓ already synchronized" : "✗ unavailable",
    successful: about.data.synchronizedSuccessfully,
  }));
}

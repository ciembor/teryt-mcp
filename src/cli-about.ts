import { callTool, type McpApp } from "@mcp-craftsman/core";

import { formatDataSummary, formatHeader } from "./cli-output.js";

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

export async function writeAbout(app: McpApp, dataDir: string, stream: NodeJS.WritableStream): Promise<void> {
  const result = await callTool(app, "about", {});
  const about = result.structuredContent as AboutContent;

  stream.write(formatHeader({
    authorEmail: about.contact.email,
    authorName: about.author.name,
    repositoryUrl: about.repository.url,
    serverName: about.server.name,
    serverVersion: about.server.version,
  }));
  stream.write(formatDataSummary({
    dataDir,
    datasets: about.data.datasets,
    status: about.data.synchronizedSuccessfully ? "✓ already synchronized" : "✗ unavailable",
    successful: about.data.synchronizedSuccessfully,
  }));
}

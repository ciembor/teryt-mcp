import type { ServerStatus } from "../domain/server-status.js";
import { terytMcpVersion } from "../../../version.js";

export type GetServerStatusInput = {
  readonly dataDir: string;
  readonly databaseExists: () => Promise<boolean>;
  readonly frameworkVersion: string;
  readonly transport: "stdio" | "http";
};

export async function getServerStatus(input: GetServerStatusInput): Promise<ServerStatus> {
  const databaseExists = await input.databaseExists();

  return {
    serverName: "teryt-mcp",
    serverVersion: terytMcpVersion,
    frameworkVersion: input.frameworkVersion,
    transport: input.transport,
    dataDir: input.dataDir,
    database: {
      status: databaseExists ? "available" : "missing",
    },
  };
}

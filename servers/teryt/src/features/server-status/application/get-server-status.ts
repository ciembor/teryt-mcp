import type { ServerStatus } from "../domain/server-status.js";

export type GetServerStatusInput = {
  readonly dataDir: string;
  readonly frameworkVersion: string;
  readonly transport: "stdio" | "http";
};

export function getServerStatus(input: GetServerStatusInput): ServerStatus {
  return {
    serverName: "teryt-mcp",
    serverVersion: "0.0.0",
    frameworkVersion: input.frameworkVersion,
    transport: input.transport,
    dataDir: input.dataDir,
    database: {
      status: "not_configured",
    },
  };
}

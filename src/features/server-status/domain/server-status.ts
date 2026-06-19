export type ServerStatus = {
  readonly serverName: string;
  readonly serverVersion: string;
  readonly frameworkVersion: string;
  readonly transport: "stdio" | "http";
  readonly dataDir: string;
  readonly database: {
    readonly status: "not_configured";
  };
};

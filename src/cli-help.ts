export const helpText = `teryt-mcp - MCP server for the official Polish TERYT registry.

Usage:
  teryt-mcp help
  teryt-mcp about
  teryt-mcp status
  teryt-mcp source-status
  teryt-mcp sync [--mode missing|stale|force] [--force]
  teryt-mcp search places <query> [--limit n]
  teryt-mcp serve

Commands:
  about          Show package information and local data sync status.
  help           Show this help.
  status         Show server runtime status as JSON.
  source-status  Show official source and local manifest status as JSON.
  sync           Synchronize the local SQLite database.
  search places  Search TERYT localities.
  serve          Start the MCP server using configured transport.

Environment:
  MCP_DATA_DIR   Directory for teryt.sqlite and sync-manifest.json.
  MCP_TRANSPORT  stdio|http. Defaults to stdio.
  MCP_PORT/PORT  HTTP port when MCP_TRANSPORT=http.
`;

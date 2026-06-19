# TERYT MCP

MCP server for the official Polish TERYT registry.

The server exposes TERC territorial units, SIMC localities, ULIC streets, and the WMRODZ locality type dictionary through MCP tools and a small CLI. It uses the published MCP Craftman packages:

- `@mcp-craftman/core`
- `@mcp-craftman/node`
- `@mcp-craftman/cli`

## Status

This project is a single server package, not a monorepo. The reusable framework lives in the separate `mcp-craftman` repository and is consumed from npm.

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.x`

## Install

```bash
pnpm install
```

## Development

```bash
pnpm quality
pnpm build
```

`pnpm quality` delegates to `mcp-craftman quality` and runs static analysis, dependency checks, architecture tests, and the unit/integration/contract test suite.

## Runtime

Build and run stdio transport:

```bash
pnpm build
node dist/main.js
```

Run HTTP transport:

```bash
MCP_TRANSPORT=http PORT=3000 node dist/main.js
```

Runtime configuration:

```text
MCP_TRANSPORT=stdio|http
MCP_PORT / PORT
MCP_DATA_DIR
XDG_CACHE_HOME
```

## CLI

```bash
pnpm build
node dist/cli.js status
node dist/cli.js source-status
node dist/cli.js sync --force
node dist/cli.js search places Kraków --limit 5
```

The CLI calls the same capabilities as MCP, so JSON output matches tool `structuredContent`.

## Tools

The public tool registry is in `src/mcp/registry.ts`.

- `health_status`
- `server_status`
- `source_status`
- `sync_database`
- `search_units`
- `search_places`
- `search_streets`
- `resolve_address`
- `get_unit`
- `get_place`
- `get_street`

See [docs/tools.md](docs/tools.md) for schemas and behavior.

## Documentation

- [docs/tools.md](docs/tools.md) - public MCP tools and CLI mapping.
- [docs/data-sync.md](docs/data-sync.md) - official TERYT download and SQLite build flow.
- [docs/quality.md](docs/quality.md) - local quality gates.
- [docs/architecture/feature-clean-architecture.md](docs/architecture/feature-clean-architecture.md) - feature layout and dependency rules.
- [docs/architecture/runtime-ecosystem.md](docs/architecture/runtime-ecosystem.md) - runtime flow and transports.
- [docs/architecture/package-boundaries.md](docs/architecture/package-boundaries.md) - boundary between TERYT and MCP Craftman.

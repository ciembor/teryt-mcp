# Local Development Tutorial

This tutorial runs the TERYT MCP server locally and exercises one read-only search path.

For creating a new generic MCP server, use the framework documentation in the `mcp-craftman` repository.

## 1. Install

```bash
pnpm install
```

Use Node.js `>=20.19.0`.

## 2. Run Quality

```bash
pnpm quality
```

This verifies dependency boundaries, TypeScript, linting, architecture tests, and behavior tests.

## 3. Build

```bash
pnpm build
```

Build output goes to `dist/`.

## 4. Check Status

```bash
node dist/cli.js status
node dist/cli.js source-status
```

`status` reports runtime configuration. `source-status` reports local database and source metadata.

## 5. Build The Local Database

Use the official eTeryt source:

```bash
node dist/cli.js sync --force
```

By default data is written under the runtime data directory resolved from:

```text
MCP_DATA_DIR
XDG_CACHE_HOME
```

## 6. Search Places

```bash
node dist/cli.js search places Kraków --limit 5
```

The CLI calls the same `search_places` capability as MCP.

## 7. Run As MCP

Stdio:

```bash
node dist/main.js
```

HTTP:

```bash
MCP_TRANSPORT=http PORT=3000 node dist/main.js
```

HTTP endpoints:

```text
GET /health
POST /tools/:toolName
```

## 8. Add Or Change A Tool

Use the feature structure documented in [architecture/feature-clean-architecture.md](architecture/feature-clean-architecture.md):

```text
src/features/<feature>/
  index.ts
  domain/
  application/
  application/ports/
  infrastructure/
  mcp/
```

Register public tools only in `src/mcp/registry.ts`, then add contract tests under `test/contracts`.

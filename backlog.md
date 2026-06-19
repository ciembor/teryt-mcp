# Backlog

This file tracks current follow-up work. Historical framework extraction notes were removed because MCP Craftman now lives in its own repository and is published as `@mcp-craftman/*`.

## Done

- TERYT MCP is a single server package.
- MCP Craftman framework packages were extracted to `/Users/maciej/Projects/mcp-craftman`.
- Published packages:
  - `@mcp-craftman/core@0.1.1`
  - `@mcp-craftman/node@0.1.1`
  - `@mcp-craftman/cli@0.1.1`
- TERYT consumes the framework from npm with `^0.1.1`.
- `pnpm quality` and `pnpm build` pass in TERYT.

## Next

- Move local development to Node.js `>=20.19.0`.
- Add an installation example for running `teryt-mcp` from a package manager once the server itself is published.
- Decide whether TERYT should publish as an npm package or remain repository-only.
- Add release notes for MCP Craftman `0.1.1`.
- Add a smoke test that installs `@mcp-craftman/cli` from npm in a temporary project and runs generated project quality.

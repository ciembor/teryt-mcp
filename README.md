# MCP Kit + TERYT MCP

This repository is a pnpm monorepo for building MCP Kit and its first real server, TERYT MCP.

## Scope

- `packages/core` - runtime-independent MCP application and capability primitives.
- `packages/node` - Node.js transports and runtime utilities.
- `packages/cli` - project generation and quality tooling.
- `servers/teryt` - MCP server for the official Polish TERYT registry.

## Development

```bash
pnpm quality
```

The quality command is currently a bootstrap placeholder and will be expanded by the framework CLI package.

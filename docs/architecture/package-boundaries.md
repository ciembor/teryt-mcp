# Package Boundaries

This repository owns only the TERYT MCP server. The reusable framework is published as npm packages under `@mcp-craftsman/*`.

## External Framework Boundary

Allowed imports:

```text
@mcp-craftsman/core
@mcp-craftsman/node
@mcp-craftsman/cli
```

Forbidden imports:

```text
@mcp-craftsman/core/src/...
@mcp-craftsman/node/src/...
@mcp-craftsman/cli/src/...
```

TERYT may depend on framework public APIs. Framework packages must not depend on this server.

## Responsibility Split

`@mcp-craftsman/core`

- capability and tool definitions;
- capability registry;
- app creation;
- direct tool calls for tests and CLIs;
- runtime-independent types.

`@mcp-craftsman/node`

- stdio and HTTP transports;
- runtime config;
- logging;
- filesystem helpers such as atomic writes and locks.

`@mcp-craftsman/cli`

- `mcp-craftsman init`;
- `mcp-craftsman quality`;
- generated server templates and quality command orchestration.

TERYT MCP

- official TERYT data model;
- source synchronization;
- SQLite build and search indexes;
- TERYT search, lookup, address-resolution, and status tools;
- `teryt-mcp` CLI.

## Local Feature Boundary

Each feature exposes a public boundary through `src/features/<feature>/index.ts`.

Allowed outside a feature:

```ts
import { searchPlaces } from "./features/search-places/index.js";
```

Avoid outside that feature implementation:

```ts
import { searchPlaces } from "./features/search-places/application/search-places.js";
```

The composition root in `src/app.ts` may import concrete infrastructure because it owns runtime assembly.

## Enforcement

- `package.json` consumes `@mcp-craftsman/*` from npm.
- package `exports` in framework packages prevent private deep imports.
- `dependency-cruiser.config.cjs` blocks cycles and local boundary violations.
- architecture tests in `test/architecture` verify registry and project shape.
- `pnpm quality` runs all of the above.

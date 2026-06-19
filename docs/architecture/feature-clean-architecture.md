# Feature Clean Architecture

Each server feature is a small vertical slice. The slice owns its domain model, use cases, ports, adapters, MCP tool, and public feature exports.

## Feature Layout

Use this structure when a feature has external dependencies:

```text
src/features/<feature>/
  index.ts
  domain/
  application/
  application/ports/
  infrastructure/
  mcp/
```

`application/ports` and `infrastructure` are optional only for pure features. If a feature touches files, HTTP, SQLite, clocks, locks, or other external systems, define the interface in `application/ports` and implement it in `infrastructure`.

## Layer Responsibilities

`domain`

- Owns feature types and domain rules.
- Does not import MCP SDK, runtime config, filesystem, HTTP, SQLite, or infrastructure.
- Can be tested without building an app.

`application`

- Owns use cases.
- Imports `domain` and local `application/ports`.
- Does not import `mcp` or `infrastructure`.
- Accepts dependencies through function arguments or dependency objects.

`application/ports`

- Defines interfaces needed by application use cases.
- Names behavior in domain language, not adapter technology.
- Keeps test doubles simple.

`infrastructure`

- Implements application ports using Node.js, files, HTTP, SQLite, or in-memory fixtures.
- May import `domain` and `application/ports`.
- Is wired only from the composition root or tests.

`mcp`

- Defines MCP capabilities with `@mcp-craftman/core`.
- Parses tool input, declares schemas and annotations, and calls application use cases.
- Does not import infrastructure.

`index.ts`

- Is the local public API for the feature.
- Re-exports use cases, MCP factories, and port types needed by the composition root or other features.
- Keeps private paths private.

## Dependency Rules

Allowed:

```text
domain
application -> domain
application -> application/ports
infrastructure -> application/ports
infrastructure -> domain
mcp -> application
mcp -> domain
composition root -> infrastructure
composition root -> feature index.ts
```

Forbidden:

```text
domain -> application
domain -> mcp
domain -> infrastructure
application -> mcp
application -> infrastructure
mcp -> infrastructure
feature -> another feature private path
```

Cross-feature imports should go through `src/features/<feature>/index.ts`. The exception is the server composition root, which may wire infrastructure because it owns runtime assembly.

## Adding A Feature

1. Create the feature folder and start with the domain type.
2. Add the application use case and ports for external dependencies.
3. Add infrastructure implementations only after the port is clear.
4. Add the MCP tool with explicit `inputSchema`, `outputSchema`, `returnsStructuredContent`, policy, and annotations.
5. Export the public pieces from `index.ts`.
6. Register the capability only in `src/mcp/registry.ts`.
7. Add contract tests for schemas, annotations, structured content, and error shape.
8. Add unit or integration tests based on the risk of the use case.
9. Run `pnpm quality`.

## TERYT Example

`sync-database` follows the full shape:

- domain: dataset codes, sync plan, database snapshots;
- application: planning and sync flow;
- ports: source, file store, database builder, manifest store, lock store;
- infrastructure: eTeryt download, local files, SQLite builder, JSON manifest, file lock;
- MCP: `sync_database` tool;
- composition root: wires concrete adapters in `src/app.ts`.

That split lets the sync use case be tested with fixture sources while production uses official GUS eTeryt downloads.

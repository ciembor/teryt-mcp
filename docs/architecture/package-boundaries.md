# Package Boundaries

MCP Kit is split into three framework packages and one example production server. Package boundaries are part of the public architecture, not only build configuration.

## Packages

`@mcp-kit/core`

- Owns runtime-independent primitives.
- Exposes capability and tool definitions, registry behavior, structured content contracts, and test-friendly helpers.
- Must not import Node.js runtime adapters or server-specific code.

`@mcp-kit/node`

- Owns Node.js runtime integration.
- Exposes stdio and HTTP transports, runtime config, logging, atomic writes, and lock helpers.
- May depend on `@mcp-kit/core`.
- Must not depend on `@mcp-kit/cli` or any server package.

`@mcp-kit/cli`

- Owns developer tooling.
- Exposes `mcp-kit init` and `mcp-kit quality`.
- May depend on `@mcp-kit/core` and `@mcp-kit/node` when generated projects or quality checks need framework knowledge.
- Must not import TERYT server code.

`servers/teryt`

- Owns TERYT domain features and server composition.
- May depend on public framework package APIs.
- Must not import framework internals outside package exports.

## Allowed Dependency Direction

```text
@mcp-kit/core
  <- @mcp-kit/node
  <- @mcp-kit/cli
  <- servers/teryt
```

`servers/teryt` may import all framework packages, but framework packages must never import from `servers/*`.

## Public API Boundary

Each framework package exposes only its root export:

```text
@mcp-kit/core
@mcp-kit/node
@mcp-kit/cli
```

Deep imports are not part of the contract:

```text
@mcp-kit/core/src/...
@mcp-kit/node/src/...
@mcp-kit/cli/src/...
```

Before publication, every API needed by TERYT or generated projects must either be exported intentionally from the package root or removed from consumers.

## Server Feature Boundary

Inside `servers/teryt`, each feature exposes a local public boundary through `index.ts`.

Allowed:

```ts
import { searchPlaces } from "./features/search-places/index.js";
```

Avoid outside a feature implementation:

```ts
import { searchPlaces } from "./features/search-places/application/search-places.js";
```

The server composition root may wire infrastructure directly because it owns runtime assembly.

## Enforcement

Current enforcement lives in:

- `dependency-cruiser.config.cjs`: blocks `packages/* -> servers/*` and dependency cycles.
- package `exports`: exposes only package roots.
- architecture tests under `packages/*/test/architecture`.
- root `pnpm quality`: runs framework and server gates.

Additional pre-publication enforcement should verify:

- server code imports framework packages only through package roots;
- every exported framework symbol has a consumer or documented purpose;
- package-level architecture tests describe allowed imports;
- release artifacts contain only `dist` and package metadata.

## Refactoring Rule

When code does not fit a package boundary:

- generic MCP behavior belongs in `@mcp-kit/core`;
- Node-specific runtime behavior belongs in `@mcp-kit/node`;
- scaffolding or quality automation belongs in `@mcp-kit/cli`;
- Polish TERYT behavior belongs in `servers/teryt`.

Do not move code into the framework only because one server uses it. Promote server code only after it is clearly generic and has a framework-level contract.

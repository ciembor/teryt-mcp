# Runtime Ecosystem

The runtime ecosystem connects framework primitives, Node.js transports, generated server structure, and server-specific CLI commands.

## Runtime Flow

```text
feature use case
  -> MCP tool capability
  -> capability registry
  -> MCP app
  -> transport or CLI
```

The same registry powers stdio, HTTP, tests, and the server CLI. Behavior should be implemented once in feature application code and exposed through capabilities.

## Core Runtime

`@mcp-kit/core` is runtime-independent. It owns:

- `defineTool`;
- `defineResource`;
- `definePrompt`;
- `defineFeature`;
- `createCapabilityRegistry`;
- `createMcpApp`;
- `callTool`;
- schema and annotation types.

Core does not know whether a tool is called over stdio, HTTP, direct tests, or a server CLI. It only validates registry shape and dispatches capability handlers.

## Node Runtime

`@mcp-kit/node` owns Node.js concerns:

- stdio transport;
- HTTP transport;
- runtime config from environment variables;
- logger creation;
- atomic writes;
- file locks.

Runtime config currently includes:

```text
MCP_TRANSPORT
MCP_PORT / PORT
MCP_DATA_DIR
XDG_CACHE_HOME
```

The Node package may call `@mcp-kit/core` helpers, but it should keep protocol routing and filesystem behavior separate from server domains.

## Server Composition

`servers/teryt/src/app.ts` is the server composition root. It wires:

- runtime config;
- source catalogs;
- manifest stores;
- file stores;
- lock stores;
- database builder;
- feature repositories;
- capability registry.

The composition root may import concrete infrastructure because it owns runtime assembly. Feature application and domain layers should stay infrastructure-free.

`servers/teryt/src/server/serve.ts` selects the transport:

```text
MCP_TRANSPORT=http -> HTTP
default            -> stdio
```

`servers/teryt/src/main.ts` is only the executable entrypoint and delegates to `serve`.

## CLI Runtime

The server CLI is `teryt-mcp`.

Commands:

```text
teryt-mcp serve
teryt-mcp status
teryt-mcp source-status
teryt-mcp sync
teryt-mcp search places Kraków
```

`serve` uses the same transport startup path as `main.ts`.

Read/write commands should either call the same public feature use case as MCP or dispatch through `callTool(createApp(config), toolName, input)`. This keeps CLI output consistent with MCP `structuredContent`.

## Transport Contracts

Stdio receives JSON-RPC-like lines and routes `tools/call` to `callTool`.

HTTP exposes:

- `GET /health`;
- `POST /tools/:toolName`.

Both transports return tool results from the same capability handlers. Transport code should not contain domain logic.

## Tests

Runtime behavior is covered at several layers:

- unit tests for pure importers and use cases;
- contract tests for tool schemas and structured content;
- CLI contract tests comparing CLI output with MCP tool output;
- stdio and HTTP roundtrip integration tests;
- architecture tests for registry and package boundaries.

When a new runtime entrypoint is added, it should prove that it reaches the same capability registry as existing entrypoints.

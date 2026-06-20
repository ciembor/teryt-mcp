# Runtime Ecosystem

The server has one capability registry that is reused by MCP transports, tests, and CLI commands.

## Flow

```text
feature use case
  -> MCP tool capability
  -> capability registry
  -> MCP app
  -> transport or CLI
```

Domain behavior belongs in feature application code. Transport code should only decode requests, call capabilities, and encode responses.

## Framework Runtime

`@mcp-craftsman/core` provides:

- `defineTool`
- `createCapabilityRegistry`
- `createMcpApp`
- `callTool`
- tool schema and annotation types

`@mcp-craftsman/node` provides:

- stdio transport;
- HTTP transport;
- runtime config from environment variables;
- stderr-safe logger;
- atomic writes;
- file locks.

## Server Composition

`src/app.ts` wires concrete runtime dependencies:

- runtime config;
- source catalogs;
- manifest stores;
- file stores;
- lock stores;
- database builder;
- feature repositories;
- capability registry.

Feature domain and application layers should not import concrete infrastructure.

## Entrypoints

`src/main.ts`

Executable MCP server entrypoint. It delegates to `src/server/serve.ts`.

`src/server/serve.ts`

Chooses the transport:

```text
MCP_TRANSPORT=http -> HTTP
default            -> stdio
```

`src/cli.ts`

Implements `teryt-mcp` commands. Commands either call a shared use case directly or dispatch through `callTool(createApp(config), toolName, input)` to keep CLI output aligned with MCP `structuredContent`.

## Transport Contracts

Stdio receives JSON-RPC-like lines and routes `tools/call` through `callTool`.

HTTP exposes:

```text
GET /health
POST /tools/:toolName
```

Both transports return the same capability results.

## Tests

- unit tests for pure importers and use cases;
- contract tests for tool schemas and structured content;
- CLI contract tests comparing CLI output with MCP tool output;
- stdio and HTTP roundtrip integration tests;
- architecture tests for registry and package boundaries.

# Backlog

This file tracks current follow-up work. Historical framework extraction notes were removed because MCP Craftman now lives in its own repository and is published as `@mcp-craftman/*`.

## Done

- TERYT MCP is a single server package.
- MCP Craftman framework packages were extracted to `/Users/maciej/Projects/mcp-craftman`.
- Published packages:
  - `@mcp-craftman/core@0.1.3`
  - `@mcp-craftman/node@0.1.2`
  - `@mcp-craftman/cli@0.1.5`
- TERYT consumes the framework from npm.
- `teryt-mcp@0.1.3` is published.
- TERYT reads runtime data from synced SQLite instead of in-memory repositories.
- TERYT runs first sync during package installation with `TERYT_MCP_SKIP_POSTINSTALL_SYNC=1` opt-out.
- `pnpm quality` and `pnpm build` pass in TERYT.

## Next

- Move local development to Node.js `>=20.19.0`.
- Add installation and first-run examples for `teryt-mcp`.
- Add release notes for current MCP Craftman and TERYT MCP releases.
- Add a smoke test that installs `@mcp-craftman/cli` from npm in a temporary project and runs generated project quality.

## Framework Next

These should stay generic. MCP Craftman is intended for any MCP server, not only TERYT.

1. Add setup lifecycle primitives.
   - [x] `defineSetupTask`
   - [x] `runSetupTasks({ mode: "missing" | "force" })`
   - [x] a postinstall helper for best-effort setup
   - [x] env opt-out such as `MCP_SKIP_POSTINSTALL_SETUP`
   - [x] stable setup logging that does not fail package installation unless explicitly configured

2. Improve runtime config.
   - [x] Accept an application name, e.g. `loadRuntimeConfig({ appName: "teryt-mcp" })`.
   - [x] Resolve app-specific data/cache directories.
   - [x] Keep `MCP_DATA_DIR` override.
   - [x] Support `XDG_CACHE_HOME`, macOS user cache, and Windows `LOCALAPPDATA`.
   - [ ] Consider `MCP_CONFIG_DIR` and `MCP_LOG_LEVEL`.

3. Add a CLI builder.
   - [x] `createMcpCli({ appName, createApp })`.
   - [x] Standard commands: `serve`, `status`, `tools`, `call`, `setup`.
   - [x] JSON output by default.
   - [x] Allow applications to add domain aliases, e.g. `search places`.

4. Add library-backed schema and validation ergonomics.
   - [x] Keep `@mcp-craftman/core` capable of accepting raw JSON Schema.
   - [x] Add an optional Zod integration package, e.g. `@mcp-craftman/zod`.
   - [x] Provide `defineZodTool({ input, output, handler })` that:
     - [x] validates input with Zod,
     - [x] infers typed handler input,
     - [x] generates MCP `inputSchema` and `outputSchema` from the same source.
   - Use Ajv for raw JSON Schema validation if/when raw schemas are validated at runtime.
   - [x] Do not build a large custom schema DSL in MCP Craftman.
   - [x] Keep small field readers such as `readRequiredStringField` for lightweight/no-Zod use cases.

5. Add project configuration loading for CLI/tooling.
   - [x] Use `cosmiconfig` for project config discovery.
   - [x] Support `mcp-craftman.config.ts`, `.mcp-craftmanrc`, and `package.json` config.
   - [x] Keep runtime env/data-dir config separate from project/tooling config.
   - [x] Do not use beta config loaders as framework foundations.

6. Generate standard quality contracts for applications.
   - [x] Registry contains expected tools.
   - [x] Every tool has output schema.
   - [x] Read/write annotations are consistent.
   - [x] Tools return structured content.
   - Invalid input errors are stable.
   - Applications do not import private framework paths.

7. Improve feature generation.
   - Generate domain type.
   - Generate application use-case.
   - Generate port.
   - Generate MCP tool.
   - Generate contract test.
   - Update registry.
   - Optionally generate an infrastructure adapter stub.
   - Default generated tools should use Zod once `@mcp-craftman/zod` exists.

8. Add generic local resource lifecycle helpers.
   - File resource store.
   - Manifest store.
   - Resource lock.
   - Atomic resource swap.
   - Snapshot metadata.
   - Generic resource sync flow for local indexes, caches, downloaded dictionaries, embedding stores, or model files.

## TERYT Next

- Decide whether search should keep JS ranking with SQL preselection, or move more ranking into SQLite.
- If optimizing search, preserve current MCP output contracts and use SQL/FTS only to reduce candidate sets first.

# Bounded Contexts

This repository contains two bounded contexts that must stay separate:

- MCP Kit framework: reusable packages for defining, running, testing, and generating MCP servers.
- TERYT MCP server: the first concrete server built with MCP Kit, focused on the Polish TERYT registry.

The framework must not contain TERYT-specific domain knowledge. TERYT can use public framework APIs, but framework packages cannot import from `servers/teryt`.

## MCP Kit Framework

MCP Kit owns the generic runtime and developer experience:

- capability and tool definitions;
- structured content contracts;
- capability registries;
- Node.js transports;
- runtime configuration helpers;
- project scaffolding;
- quality checks for generated and framework code.

Framework packages should remain reusable for other MCP servers. A new server should be able to use `@mcp-kit/core`, `@mcp-kit/node`, and `@mcp-kit/cli` without accepting any TERYT dependency, naming, schema, fixture, or workflow.

## TERYT MCP Server

TERYT MCP owns the Polish territorial registry domain:

- TERC territorial units;
- SIMC localities;
- ULIC streets;
- WMRODZ locality type dictionary;
- TERYT source synchronization;
- TERYT SQLite database building;
- search, details lookup, and address resolution up to street level;
- server-specific CLI commands such as `teryt-mcp sync` and `teryt-mcp search places Kraków`.

TERYT features follow the local feature structure:

```text
domain
application
application/ports
infrastructure
mcp
index.ts
```

The public `index.ts` file is the feature boundary. Other features and CLI code should import through it unless they are in the server composition root.

## Out Of Scope

The TERYT bounded context does not include:

- REGON;
- BDL;
- PRG;
- geocoding;
- maps;
- unofficial address datasets;
- parcel or building geometry;
- business registry enrichment.

Those areas require separate bounded contexts or separate servers. They should not be smuggled into TERYT naming, persistence, or search models.

## Dependency Direction

Allowed direction:

```text
servers/teryt -> packages/*
```

Forbidden direction:

```text
packages/* -> servers/teryt
```

The framework is productized only through public package exports. TERYT is allowed to prove framework usefulness, but it must not become an implicit framework dependency.

## Source Of Truth

The source of truth for framework behavior is the public API exposed by `packages/*`.

The source of truth for TERYT data behavior is the official TERYT dataset model represented by `TERC`, `SIMC`, `ULIC`, and `WMRODZ`, plus server tests and fixtures that preserve Polish identifiers as text.

When a change crosses these boundaries, treat it as a design decision:

- generic MCP concern: implement in framework packages;
- Polish registry concern: implement in `servers/teryt`;
- shared convenience that leaks domain terms: keep it out of the framework.

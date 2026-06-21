# TERYT Tools

TERYT MCP exposes public tools through `src/mcp/registry.ts`. The registry is explicit and sorted by capability name.

All tools return `structuredContent` and have `outputSchema`.

## about

Read-only package, contact, repository, server version, and local data synchronization status.

Input: none.

Returns:

```text
author name
contact email
repository URL
server name and version
data synchronization status
last synchronized at
TERYT data stateDate per dataset
```

TERYT datasets do not expose a package-style semantic version in this server. The tool reports `stateDate` as the data version stamp.

## health_status

Read-only health check.

Input: none.

Returns:

```text
ok
```

## server_status

Read-only server runtime status.

Input: none.

Returns:

```text
server name
server version
framework version
transport
data dir
database status
```

## source_status

Read-only source and local manifest status.

Input: none.

Returns:

```text
local database status
remote source catalog status
last checked at
last successful sync
stateDate
sha256 when known
source errors
```

Remote source errors are reported in structured content rather than crashing the server.

## sync_database

Write tool for local database synchronization.

Input:

```text
mode: missing | stale | force
```

Returns:

```text
status: skipped | synced
mode
databasePath
datasets
```

`missing` skips when a local database already exists. `force` rebuilds the database atomically under a lock.

## search_units

Read-only search over TERC units.

Input:

```text
query: string
limit?: number, default 20, max 100
```

Returns units with:

```text
unit
stateDate
matchedBy
confidence
```

Ranking supports exact code, exact normalized name, prefix, and normalized substring matching.

## search_places

Read-only search over SIMC localities.

Input:

```text
query: string
limit?: number, default 20, max 100
```

Returns places with:

```text
place
stateDate
matchedBy
confidence
```

Ranking supports exact code, exact normalized name, prefix, and normalized substring matching.

## search_streets

Read-only search over ULIC streets.

Input:

```text
query: string
limit?: number, default 20, max 100
```

Returns streets with:

```text
street
stateDate
matchedBy
confidence
```

Ranking supports exact code, exact normalized name, prefix, and normalized substring matching.

## resolve_address

Read-only address candidate resolution up to street level.

Input:

```text
query?: string
place?: string
street?: string
limit?: number, default 20, max 100
```

Provide either `query` or both `place` and `street`. Structured fields are preferred.

Returns address candidates with:

```text
address
stateDate
matchedBy
confidence
```

The tool requires both a locality and a street and resolves territorial unit, place, and street identifiers. Use `search_places` for locality-only requests. It does not geocode and does not return coordinates.

## get_unit

Read-only lookup by unit id.

Input:

```text
id: string
```

Returns TERC unit details.

## get_place

Read-only lookup by place id.

Input:

```text
id: string
```

Returns SIMC place details.

## get_street

Read-only lookup by street id.

Input:

```text
id: string
```

Returns ULIC street details.

## CLI Mapping

The `teryt-mcp` CLI calls the same capabilities:

```text
teryt-mcp about          -> about
teryt-mcp help           -> CLI help
teryt-mcp status         -> server_status or shared status use case
teryt-mcp source-status  -> source_status
teryt-mcp sync           -> sync_database
teryt-mcp search places  -> search_places
```

This keeps CLI JSON output consistent with MCP `structuredContent`.

# TERYT MCP

MCP server for the official Polish TERYT registry. It exposes territorial units
(`TERC`), localities (`SIMC`), streets (`ULIC`), and the locality type dictionary
(`WMRODZ`) as MCP tools.

Use it when an assistant or automation needs to answer questions such as:

- "What TERYT unit is Boleslawiec?"
- "Find SIMC localities matching Krakow."
- "Resolve Boleslawiec Marszalkowska to TERYT identifiers."
- "Look up this TERC, SIMC, or ULIC identifier."

The package is published as `teryt-mcp`.

## Install

Run directly with npm:

```bash
npx -y teryt-mcp serve
```

Or install it globally:

```bash
npm install -g teryt-mcp
teryt-mcp serve
```

Requirements:

- Node.js `>=20.19.0`

On install, the package tries to create the local SQLite database from official
TERYT source files. If that initial sync fails, installation still completes and
the server can sync later through the `sync_database` tool or CLI.

Skip install-time sync when needed:

```bash
TERYT_MCP_SKIP_POSTINSTALL_SYNC=1 npm install -g teryt-mcp
```

## Connect An MCP Client

Use stdio transport for MCP clients:

```json
{
  "mcpServers": {
    "teryt": {
      "command": "npx",
      "args": ["-y", "teryt-mcp", "serve"]
    }
  }
}
```

For a global install:

```json
{
  "mcpServers": {
    "teryt": {
      "command": "teryt-mcp",
      "args": ["serve"]
    }
  }
}
```

Set a stable data directory if the client runs in an ephemeral environment:

```json
{
  "mcpServers": {
    "teryt": {
      "command": "npx",
      "args": ["-y", "teryt-mcp", "serve"],
      "env": {
        "MCP_DATA_DIR": "/absolute/path/to/teryt-data"
      }
    }
  }
}
```

## Runtime Configuration

```text
MCP_TRANSPORT=stdio|http  # default: stdio
MCP_PORT / PORT           # default: 3000 for HTTP
MCP_DATA_DIR              # database and sync manifest directory
XDG_CACHE_HOME            # used when MCP_DATA_DIR is not set
MCP_LOG_LEVEL             # debug|info|warn|error|silent
```

Local files:

```text
<data-dir>/teryt.sqlite
<data-dir>/sync-manifest.json
<data-dir>/*.lock
```

## First Sync

The server can answer status tools without a database. Search and lookup tools
need a local database.

Force a sync from official TERYT data:

```bash
npx -y teryt-mcp sync --force
```

Or through MCP:

```json
{
  "mode": "force"
}
```

with tool `sync_database`.

Sync modes:

```text
missing  build only when the local database is missing
stale    reserved for stale-data rebuild policy
force    rebuild the database under a lock
```

The sync writes a new SQLite database atomically. Readers should either see the
old database or the new database, not a partial file.

## CLI

The CLI is useful for local checks and scripts. It calls the same capabilities as
the MCP server where commands overlap.

```bash
teryt-mcp serve
teryt-mcp status
teryt-mcp source-status
teryt-mcp sync
teryt-mcp sync --force
teryt-mcp sync --mode missing
teryt-mcp search places Kraków --limit 5
```

Current CLI search support is limited to `search places`. The MCP server exposes
the full tool set listed below.

Example:

```bash
teryt-mcp search places Boleslawiec --limit 1
```

Response shape:

```json
{
  "places": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_name",
      "place": {
        "id": "0009876",
        "name": "Bolesławiec",
        "stateDate": "2026-01-01",
        "unitId": "02-01-01-1"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

Actual identifiers and dates depend on the TERYT snapshot in your local database.

## HTTP Mode

HTTP mode is mainly for local testing or wrappers:

```bash
MCP_TRANSPORT=http PORT=3000 teryt-mcp serve
```

Endpoints:

```text
GET  /health
POST /tools/:toolName
```

Example:

```bash
curl -s http://127.0.0.1:3000/tools/search_places \
  -H 'content-type: application/json' \
  -d '{"query":"Kraków","limit":3}'
```

Response shape:

```json
{
  "structuredContent": {
    "places": [
      {
        "confidence": 0.95,
        "matchedBy": "exact_normalized_name",
        "place": {
          "id": "0000000",
          "name": "Kraków",
          "stateDate": "2026-01-01",
          "unitId": "12-61-00-0"
        }
      }
    ],
    "stateDate": "2026-01-01"
  }
}
```

## MCP Tools

All tools return `structuredContent`. Search tools normalize Polish diacritics,
support exact code matches, exact normalized names, prefixes, and full-text
matches where applicable. They do not geocode and do not return coordinates.

### `health_status`

Health check.

Input:

```json
{}
```

Expected response:

```json
{
  "ok": true
}
```

Useful prompt:

```text
Check whether the TERYT MCP server is alive.
```

### `server_status`

Runtime status.

Input:

```json
{}
```

Expected response:

```json
{
  "serverName": "teryt-mcp",
  "serverVersion": "0.1.5",
  "frameworkVersion": "0.2.0",
  "transport": "stdio",
  "dataDir": "/path/to/teryt-data",
  "database": {
    "status": "not_configured"
  }
}
```

Useful prompt:

```text
Show me the TERYT server status and where it stores its local database.
```

### `source_status`

Reports local database and official source metadata.

Input:

```json
{}
```

Expected response shape:

```json
{
  "datasets": [
    {
      "dataset": {
        "code": "TERC",
        "name": "Territorial units",
        "sourceUrl": "https://eteryt.stat.gov.pl/eTeryt/"
      },
      "snapshot": null,
      "stateDate": null,
      "sha256": null
    }
  ],
  "lastCheckedAt": null,
  "lastSuccessfulSync": null,
  "localDatabase": {
    "status": "missing"
  },
  "remoteSource": {
    "status": "unknown",
    "errors": []
  }
}
```

Useful prompt:

```text
Check if my local TERYT database exists and what source snapshot it uses.
```

### `sync_database`

Builds or rebuilds the local SQLite database from official TERYT data.

Input:

```json
{
  "mode": "missing"
}
```

Allowed modes:

```text
missing
stale
force
```

Expected response when a database already exists and mode is `missing`:

```json
{
  "status": "skipped",
  "mode": "missing",
  "databasePath": null,
  "datasets": []
}
```

Expected response after a rebuild:

```json
{
  "status": "synced",
  "mode": "force",
  "databasePath": "/path/to/teryt.sqlite",
  "datasets": [
    {
      "dataset": "TERC",
      "recordCount": 123456,
      "stateDate": "2026-01-01",
      "source": "official-teryt-download",
      "sourceUrl": "https://eteryt.stat.gov.pl/eTeryt/",
      "variant": "full"
    }
  ]
}
```

Useful prompt:

```text
Synchronize the local TERYT database if it is missing.
```

Use force mode only when you deliberately want a rebuild:

```text
Rebuild the local TERYT database from the official source.
```

### `search_units`

Searches TERC territorial units.

Input:

```json
{
  "query": "dolnoslaskie",
  "limit": 5
}
```

Expected response shape:

```json
{
  "units": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_name",
      "unit": {
        "id": "02",
        "name": "DOLNOŚLĄSKIE",
        "stateDate": "2026-01-01",
        "type": "województwo"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

Useful prompts:

```text
Find the TERYT unit for województwo dolnośląskie.
Search TERYT units matching Boleslawiec and show their identifiers.
```

### `search_places`

Searches SIMC localities.

Input:

```json
{
  "query": "Kraków",
  "limit": 5
}
```

Expected response shape:

```json
{
  "places": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_name",
      "place": {
        "id": "0000000",
        "name": "Kraków",
        "stateDate": "2026-01-01",
        "unitId": "12-61-00-0"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

Useful prompts:

```text
Find SIMC localities named Kraków.
Find places matching "Stara Wieś" and return their SIMC identifiers.
```

### `search_streets`

Searches ULIC streets.

Input:

```json
{
  "query": "Marszałkowska",
  "limit": 5
}
```

Expected response shape:

```json
{
  "streets": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_name",
      "street": {
        "id": "0009876-0000123",
        "code": "0000123",
        "name": "Marszałkowska",
        "placeId": "0009876",
        "stateDate": "2026-01-01"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

Useful prompts:

```text
Find ULIC streets named Marszałkowska.
Search for the street code 0000123.
```

### `resolve_address`

Resolves an address candidate up to street level. This is identifier resolution,
not geocoding.

Input:

```json
{
  "query": "Boleslawiec Marszalkowska",
  "limit": 5
}
```

Expected response shape:

```json
{
  "addresses": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_address",
      "address": {
        "id": "0009876-0000123",
        "unit": {
          "id": "02-01-01-1",
          "name": "Bolesławiec",
          "type": "gmina miejska"
        },
        "place": {
          "id": "0009876",
          "name": "Bolesławiec"
        },
        "street": {
          "id": "0009876-0000123",
          "code": "0000123",
          "name": "Marszałkowska"
        },
        "stateDate": "2026-01-01"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

Useful prompts:

```text
Resolve "Boleslawiec Marszalkowska" to TERYT identifiers.
Find the TERC, SIMC and ULIC identifiers for this locality and street.
```

### `get_unit`

Looks up a TERC unit by id.

Input:

```json
{
  "id": "02-01-01-1"
}
```

Expected response shape:

```json
{
  "unit": {
    "id": "02-01-01-1",
    "name": "Bolesławiec",
    "stateDate": "2026-01-01",
    "type": "gmina miejska"
  },
  "stateDate": "2026-01-01"
}
```

Missing ids return:

```json
{
  "unit": null,
  "stateDate": null
}
```

Useful prompt:

```text
Look up TERYT unit 02-01-01-1.
```

### `get_place`

Looks up a SIMC locality by id.

Input:

```json
{
  "id": "0009876"
}
```

Expected response shape:

```json
{
  "place": {
    "id": "0009876",
    "name": "Bolesławiec",
    "stateDate": "2026-01-01",
    "unitId": "02-01-01-1"
  },
  "stateDate": "2026-01-01"
}
```

Missing ids return:

```json
{
  "place": null,
  "stateDate": null
}
```

Useful prompt:

```text
Look up SIMC locality 0009876.
```

### `get_street`

Looks up a ULIC street by id.

Input:

```json
{
  "id": "0009876-0000123"
}
```

Expected response shape:

```json
{
  "street": {
    "id": "0009876-0000123",
    "code": "0000123",
    "name": "Marszałkowska",
    "placeId": "0009876",
    "stateDate": "2026-01-01"
  },
  "stateDate": "2026-01-01"
}
```

Missing ids return:

```json
{
  "street": null,
  "stateDate": null
}
```

Useful prompt:

```text
Look up ULIC street 0009876-0000123.
```

## Matching Semantics

`matchedBy` explains why a result was returned:

```text
exact_code
exact_normalized_name
exact_normalized_address
prefix
fts
```

`confidence` is a ranking score, not an official registry value. Exact code
matches rank highest. Full-text matches rank lower.

## Limitations

- No coordinates.
- No parcel or building lookup.
- No postal code lookup.
- No address-point validation.
- Results depend on the local TERYT snapshot.

## Development

This section is for contributors to this repository.

```bash
pnpm install
pnpm build
pnpm quality
```

Architecture and tool details:

- [docs/tools.md](docs/tools.md)
- [docs/data-sync.md](docs/data-sync.md)
- [docs/architecture/feature-clean-architecture.md](docs/architecture/feature-clean-architecture.md)
- [docs/architecture/runtime-ecosystem.md](docs/architecture/runtime-ecosystem.md)

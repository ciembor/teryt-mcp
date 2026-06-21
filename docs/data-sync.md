# TERYT Data Sync

`sync_database` builds the local SQLite database from official TERYT datasets published by GUS eTeryt.

## Scope

The sync covers:

- `TERC`: territorial units;
- `SIMC`: localities;
- `ULIC`: streets;
- `WMRODZ`: locality type dictionary.

It does not cover REGON, BDL, PRG, geocoding, maps, unofficial address sources, parcels, or building geometry.

## Source Of Truth

The production source adapter is `EterytSource` in `src/features/sync-database/infrastructure/eteryt-source.ts`.

It downloads full files from the official eTeryt page:

```text
https://eteryt.stat.gov.pl/eTeryt/rejestr_teryt/udostepnianie_danych/baza_teryt/uzytkownicy_indywidualni/pobieranie/pliki_pelne.aspx
```

The adapter uses the page's ASP.NET postback form for the full-file download buttons. Tests use fixture sources so the contract suite does not depend on the network.

## Sync Flow

`syncDatabase` executes under a file lock:

```text
plan
download TERC, SIMC, ULIC, WMRODZ
hash source files
extract ZIP when needed
parse CSV
validate columns, STAN_NA, record counts, and relations
build SQLite schema
insert raw tables
insert search tables
build normalized-name indexes
atomically swap teryt.sqlite
write sync-manifest.json
```

If sync fails before the atomic swap, the previous database remains untouched and no new manifest is written.

## Modes

`missing`

Builds the database only when `teryt.sqlite` does not exist.

`stale`

Skips a compatible database modified less than 24 hours ago. Rebuilds databases that are at least 24 hours old, have no usable modification timestamp, or use an incompatible schema.

`force`

Downloads and rebuilds the database even when a local database already exists.

## Local Files

The data directory comes from runtime config:

```text
MCP_DATA_DIR
XDG_CACHE_HOME
```

The sync writes:

```text
teryt.sqlite
sync-manifest.json
sync.lock
```

`teryt.sqlite` is written through `atomicWrite`. The lock prevents concurrent syncs for the same data directory.

## SQLite Shape

The builder creates raw and searchable tables:

```text
raw_terc
raw_simc
raw_ulic
raw_wmrodz
units
places
streets
metadata
normalized-name indexes for units, places, and streets
```

TERYT identifiers are stored as `TEXT` to preserve leading zeroes.

## Manifest

The manifest records:

```text
schemaVersion
dataset
variant
stateDate
downloadedAt
publishedAtObserved
sha256
recordCount
columns
source
sourceUrl
```

The `source_status` tool reads this manifest to report local database state.

## CLI

Run sync through the server CLI:

```bash
teryt-mcp sync
teryt-mcp sync --force
teryt-mcp sync --mode stale
```

The CLI calls the same `sync_database` capability as MCP, so output matches MCP `structuredContent`.

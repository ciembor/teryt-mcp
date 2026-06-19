# Bounded Context

TERYT MCP covers official Polish territorial registry lookup and synchronization.

## Included

- `TERC`: territorial units.
- `SIMC`: localities.
- `ULIC`: streets.
- `WMRODZ`: locality type dictionary.
- Synchronization from official GUS eTeryt full files.
- Search, details lookup, and address resolution up to street level.

## Excluded

- REGON.
- BDL.
- PRG.
- geocoding;
- maps;
- unofficial address datasets;
- parcels, buildings, and geometry.

Those concerns need separate bounded contexts or separate MCP servers. They should not be added to TERYT naming, persistence, search ranking, or capability schemas.

## Dependency Direction

```text
TERYT MCP -> @mcp-craftman/*
```

The reverse dependency is forbidden. MCP Craftman must remain reusable by servers that know nothing about Polish registry data.

## Source Of Truth

Framework behavior is defined by public `@mcp-craftman/*` APIs.

TERYT behavior is defined by official TERYT datasets, local fixtures, and contract tests that preserve Polish identifiers as text.

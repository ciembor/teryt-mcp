# MCP Intent Selection

The client model selects tools from their runtime names, descriptions, and schemas. README examples are not a substitute for runtime metadata.

| User intent | Expected action |
| --- | --- |
| `Znajdź kod województwa dolnośląskiego` | `search_units` (TERC administrative unit) |
| `Znajdź SIMC miejscowości Kraków` | `search_places` (SIMC locality) |
| `Znajdź ulice Marszałkowskie` | `search_streets` (ULIC across localities) |
| `Znajdź ulicę Marszałkowską w Wieliszewie` | `resolve_address` (locality and street relation) |
| `Sprawdź jednostkę 02-01-01-1` | `get_unit` |
| `Sprawdź miejscowość 0950463` | `get_place` |
| `Sprawdź ulicę 0008639-12400` | `get_street` |
| `Jaki jest TERYT Warszawy?` | Ask whether the user means the TERC administrative unit or SIMC locality; both are valid |
| Search reports a missing database | `sync_database` with `missing` or `force`, then retry |

Server-level MCP instructions would be useful for cross-tool routing, but MCP Craftsman 0.2.1 does not expose the protocol `instructions` field. Until the framework supports it, routing guidance remains in tool descriptions and schemas.


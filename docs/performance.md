# Performance Baseline

Baseline measured on 2026-06-21 with Node.js 20.19.6 on macOS, using the full official TERYT datasets:

- TERC: 4,360 records;
- SIMC: 101,865 records;
- ULIC: 308,202 records;
- WMRODZ: 12 records.

The HTTP server was kept alive while each request was executed three times. Values below are the median wall-clock latency reported by `curl`:

| Tool | Query | Median |
| --- | --- | ---: |
| `search_units` | `dolnoslaskie` | 24 ms |
| `search_places` | `Kraków` | 39 ms |
| `search_streets` | `Marszałkowska` | 89 ms |
| `resolve_address` | `ul. Marszałkowskiej w Wieliszewie` | 377 ms |

Maximum resident set size observed for the server process was approximately 249 MB.

## Decision

Version 0.1.8 keeps `sql.js` and normalized SQLite indexes. The measured search latency is acceptable for the current local MCP use case, and `matchedBy: "contains"` accurately describes substring ranking.

FTS5 is deferred because the current `sql.js` runtime does not provide it. Reconsider a native SQLite runtime or FTS5 build if `resolve_address` exceeds 500 ms median, street search exceeds 150 ms median, memory becomes material for target clients, or the dataset grows substantially.


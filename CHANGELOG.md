# Changelog

## 0.1.8

- Fix `source_status` to read `sync-manifest.json` and report the real SQLite state.
- Add SQLite schema versioning, compatibility errors, and automatic rebuilds for outdated databases.
- Correct ULIC name composition and require full `SIMC-SYM_UL` identifiers for `get_street`.
- Move search candidate filtering and deterministic ranking into SQLite using normalized-name indexes.
- Improve `resolve_address` with structured `place`/`street` input and natural street-place ordering.
- Improve MCP tool descriptions and identifier schemas for TERC, SIMC, and ULIC intent selection.
- Return an actionable error when the local database is missing.
- Harden CSV and ZIP imports for BOM, escaped quotes, multiline fields, and multiple CSV entries.
- Add full npm package smoke coverage for install, sync, status, search, and MCP stdio.


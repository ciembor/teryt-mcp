# Changelog

## 0.1.11

- Add `teryt-mcp about` and `teryt-mcp help` CLI commands.
- Keep npm installation successful when install-time synchronization fails.
- Treat corrupt local SQLite files as unusable so status and sync paths can recover.
- Retry eTeryt downloads on transient HTTP `429` and `5xx` responses.
- Check the concrete eTeryt full-file download endpoint in `source_status`.

## 0.1.10

- Add the `about` MCP tool with author, contact, repository, server version, synchronization status, and TERYT data state dates.
- Improve install-time output with an ASCII banner, package metadata, and synchronization result details.
- Fix the postinstall wrapper so it explicitly runs the built `runPostinstallSync` export.
- Make `sync --force` rebuild without reading metadata from a potentially corrupt existing database.
- Harden address validation for postal codes with punctuation while allowing numeric street names.
- Add timeout and retry handling for official eTeryt downloads.

## 0.1.9

- Add a committed postinstall wrapper so fresh repository installs do not require `dist/postinstall.js`.
- Build before npm packing and publishing through `prepack`.
- Rebuild the database in `sync --mode missing` when the SQLite file exists but the manifest is missing or incompatible.
- Avoid parsing TERYT source files twice during synchronization.
- Reject single-digit building numbers in `resolve_address`.

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

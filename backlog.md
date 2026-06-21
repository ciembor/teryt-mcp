# Backlog

This file tracks work that remains after the runtime, sync, SQLite, MCP contract, and documentation fixes prepared for `teryt-mcp@0.1.8`.

## Release And Database Migration

- [x] Add an explicit SQLite schema version to the database metadata and sync manifest.
- [x] Detect an incompatible existing database and return an actionable `sync --force` error instead of a raw SQLite column error.
- [x] Automatically rebuild an outdated schema during postinstall/missing sync while preserving explicit `sync --force`.
- [x] Publish version 0.1.8 to npm and verify a clean global upgrade (requires explicit release authorization).
- [x] Add a clean `npm pack` installation smoke test that performs sync, status, search, and an MCP stdio roundtrip.

## Search And Performance

- [x] Make SQL candidate ordering deterministic before `LIMIT`, preserving exact code, exact normalized name, prefix, and substring priority.
- [x] Benchmark search and `resolve_address` against the full TERC, SIMC, and ULIC datasets, including latency and memory usage.
- [x] Keep normalized SQLite indexes for 0.1.8; measured latency is acceptable for the local MCP use case.
- [x] Defer FTS5 with explicit performance thresholds; keep `matchedBy: "contains"` truthful.

## Address Resolution

- [x] Support common Polish inflected locality/street forms, including `Warszawie`, `Krakowie`, `Bolesławcu`, and adjective forms such as `Marszałkowskiej`.
- [x] Expand normalization for common street prefixes and variants such as `al.`, `aleja`, `pl.`, `plac`, and punctuation-heavy input.
- [x] Keep `resolve_address` scoped to locality-and-street relations; route locality-only requests to `search_places`.
- [x] Reject building numbers and postal codes with actionable errors; they are outside TERYT scope.
- [x] Add packaged smoke tests based on real TERYT relations for natural Polish prompts in both place-street and street-place order.

## Source Freshness And Status

- [x] Implement a 24-hour `stale` policy instead of rebuilding unconditionally.
- [x] Populate `lastCheckedAt` and `remoteSource.status` by checking the official eTeryt source.
- [x] Verify consistency between `teryt.sqlite` and `sync-manifest.json`, including missing files, mismatched schema versions, and interrupted manual changes.

## MCP Client UX

- [x] Add an intent-selection matrix and runtime metadata contracts, including clarification for ambiguous `Jaki jest TERYT Warszawy?` prompts.
- [x] Evaluate server-level MCP instructions; defer until MCP Craftsman exposes the protocol `instructions` field.
- [x] Document Codex configuration through `~/.codex/config.toml` and `codex mcp add`, separately from generic client and VS Code `mcp.json` examples.
- [x] Verify the published package in Codex after a fresh process restart and confirm all tools are discoverable.

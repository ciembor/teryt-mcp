# Quality

The project quality gate is:

```bash
pnpm quality
```

It runs `mcp-craftman quality` from `@mcp-craftman/cli`.

## Steps

The current command runs these checks in order:

```text
knip
tsc --noEmit
eslint . --fix
dependency-cruiser --config dependency-cruiser.config.cjs .
vitest run test/architecture
vitest run --coverage test/unit test/integration test/contracts
```

There is no separate CI mode yet. The lint step may rewrite files.

## What Each Gate Catches

`knip`

Unused files, exports, and package dependencies.

`tsc --noEmit`

TypeScript contract errors without writing build output.

`eslint . --fix`

Style issues and code smells, including `eslint-plugin-sonarjs`.

`dependency-cruiser`

Cycles and forbidden dependency directions.

`vitest run test/architecture`

Project shape, public capability registry, and import-boundary contracts.

`vitest run --coverage`

Unit, integration, and contract behavior.

## Pre-Commit Hook

The package `prepare` script configures `.githooks/pre-commit` as the Git hooks directory when the repository is installed:

```bash
git config core.hooksPath .githooks
```

The hook runs `pnpm quality`.

## Runtime Requirement

`package.json` declares:

```text
node >=20.19.0
```

Older Node versions are not a supported development environment, even if some checks happen to run.

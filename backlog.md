# MCP Kit + TERYT MCP - backlog dla agenta AI

## Cel

Zbuduj monorepo, w którym równolegle powstają:

- framework do tworzenia serwerów MCP,
- pierwszy realny serwer MCP oparty o ten framework: TERYT MCP.

TERYT MCP jest pierwszym use case'em frameworka. Framework ma powstawać w trakcie budowy tego serwera, a nie jako abstrakcja bez użycia. Każdy element frameworka powinien być natychmiast użyty przez `servers/teryt`.

## Główne zasady

1. Jeden MCP server obsługuje jeden bounded context.
2. Serwer MCP nie jest wspólnym workiem na różne integracje.
3. Jeśli różnią się właściciele, model danych albo rytm zmian, powstaje osobny serwer MCP.
4. TERYT MCP obejmuje tylko oficjalny polski rejestr terytorialny: TERC, SIMC, ULIC, WMRODZ, synchronizacja i wyszukiwanie.
5. REGON, BDL, PRG, geokodowanie i mapy nie należą do TERYT MCP.
6. Rdzeń aplikacji ma być niezależny od transportu.
7. MCP jest adapterem, nie miejscem logiki domenowej.
8. CLI używa tych samych use case'ów co MCP.
9. Framework musi być gotowy do wydzielenia do osobnego pakietu.
10. Serwer TERYT może używać frameworka tylko przez publiczne API pakietów.

## Docelowa struktura repo

```text
repo/
  packages/
    core/
    node/
    cli/
  servers/
    teryt/
  docs/
```

## Pakiety frameworka

### `packages/core`

Odpowiada za:

- składanie aplikacji MCP,
- definicje capability,
- rejestr capability,
- walidacje registry,
- helpery testów architektonicznych,
- typy niezależne od runtime.

Nie może zależeć od Node runtime, filesystemu, HTTP ani konkretnego serwera domenowego.

### `packages/node`

Odpowiada za:

- transport stdio,
- transport HTTP,
- konfigurację runtime z env,
- logger bezpieczny dla stdio,
- narzędzia Node runtime, np. cache dir, atomic write, lock file.

### `packages/cli`

Odpowiada za:

- `mcp-kit init`,
- `mcp-kit quality`,
- generowanie struktury serwera,
- generowanie testów architektonicznych,
- generowanie konfiguracji narzędzi,
- analizę projektu.

## Architektura serwera

Każdy wygenerowany serwer ma mieć układ:

```text
src/
  app.ts
  main.ts
  mcp/
    registry.ts
  server/
    transports/
      http.ts
      stdio.ts
  features/
    health/
      index.ts
      domain/
      application/
      mcp/
```

Rozwijana feature ma układ:

```text
src/features/<feature>/
  index.ts
  domain/
  application/
  application/ports/
  mcp/
  infrastructure/
```

`application/ports` i `infrastructure` są opcjonalne, ale gdy feature dotyka bazy, HTTP, plików albo innych zewnętrznych systemów, porty muszą być w `application/ports`, a implementacje w `infrastructure`.

## Reguły zależności

1. `domain` może zależeć tylko od własnego `domain`.
2. `application` może zależeć od `domain` i własnych `application/ports`.
3. `application` nie może importować `mcp`.
4. `application` nie może importować `infrastructure`.
5. `mcp` może importować `application` i `domain`.
6. `mcp` nie może importować `infrastructure`.
7. `infrastructure` może importować `application/ports` i `domain`.
8. Tylko `infrastructure` albo composition root może importować `infrastructure`.
9. Composition root jest w `src/app.ts`.
10. Importy między feature muszą iść przez `src/features/<feature>/index.ts`.
11. `domain` i `application` nie mogą importować MCP SDK.
12. Nie może być cykli zależności.
13. Transporty nie mogą zawierać logiki domenowej.

## Capability rules

1. Publiczne capability są rejestrowane wyłącznie w `src/mcp/registry.ts`.
2. Rejestr capability ma być jawny.
3. Rejestr capability ma być deterministycznie posortowany.
4. Nazwy capability są stabilne i spójne w całym projekcie.
5. Używaj `snake_case` dla tooli, np. `search_places`.
6. Tool zwracający `structuredContent` musi mieć `outputSchema`.
7. Tool `list_*` musi mieć `limit`.
8. Tool wyszukiwawczy musi mieć `limit`.
9. Read/write policy musi być spójne z adnotacjami MCP.
10. `stdio` nie może pisać aplikacyjnego outputu na stdout, tylko na stderr.

## Quality command

Framework ma dostarczać jedno polecenie:

```bash
mcp-kit quality
```

Bez wariantów `--fix` i bez osobnego `--ci`.

To polecenie ma być domyślnie podpinane do pre-commit.

Kolejność narzędzi:

```text
1. knip - wykrywa martwy kod, nieużywane eksporty, nieużywane zależności i brakujące zależności w package.json
2. tsc --noEmit - sprawdza typy TypeScript bez generowania plików
3. eslint . --fix - robi linting, automatycznie naprawia naprawialne problemy i odpala code smells przez eslint-plugin-sonarjs
4. dependency-cruiser - sprawdza granice architektury importów, np. brak cykli i zakazane zależności między warstwami
5. vitest run test/architecture - uruchamia testy architektoniczne frameworka i MCP
6. vitest run --coverage test/unit test/integration test/contracts - uruchamia testy aplikacji i sprawdza coverage według progów
```

Nie dodawaj `jscpd`. W feature-first pewna podobna struktura kodu jest zamierzona i pomaga utrzymać niski coupling.

ESLint ma używać:

```text
typescript-eslint
eslint-plugin-sonarjs
```

Nie dodawaj `eslint-plugin-unicorn` na start.

## Faza 0 - przygotowanie

### Checklist

- [x] Utwórz repo jako monorepo.
- [x] Ustal package manager: `pnpm`.
- [x] Dodaj root `package.json`.
- [x] Dodaj `pnpm-workspace.yaml`.
- [x] Dodaj `tsconfig.base.json`.
- [x] Dodaj `.gitignore`.
- [x] Dodaj podstawowy `README.md`.
- [x] Repo ma katalogi `packages`, `servers`, `docs`.
- [x] Workspace widzi pakiety i serwer.
- [x] Root ma script `quality`.

### Zadania

1. Utwórz repo jako monorepo.
2. Ustal package manager: `pnpm`.
3. Dodaj root `package.json`.
4. Dodaj `pnpm-workspace.yaml`.
5. Dodaj `tsconfig.base.json`.
6. Dodaj `.gitignore`.
7. Dodaj podstawowy `README.md`.

### Kryteria wykonania

- Repo ma katalogi `packages`, `servers`, `docs`.
- Workspace widzi pakiety i serwer.
- Root ma script `quality`, nawet jeśli na początku jest placeholderem.

## Faza 1 - bootstrap framework packages

### Checklist

- [x] Utwórz `packages/core`.
- [x] Utwórz `packages/node`.
- [x] Utwórz `packages/cli`.
- [x] Każdy pakiet ma własny `package.json`.
- [x] Każdy pakiet ma publiczne `exports`.
- [x] Każdy pakiet ma `src/index.ts`.
- [x] Dodaj build przez `tsup`.
- [x] Dodaj testy przez `vitest`.
- [x] Pakiety budują się niezależnie.
- [x] Żaden pakiet nie importuje z `servers/*`.
- [x] Publiczne API idzie przez `src/index.ts`.

### Zadania

1. Utwórz `packages/core`.
2. Utwórz `packages/node`.
3. Utwórz `packages/cli`.
4. Każdy pakiet ma mieć własny `package.json`.
5. Każdy pakiet ma mieć własne publiczne `exports`.
6. Każdy pakiet ma mieć `src/index.ts`.
7. Dodaj build przez `tsup`.
8. Dodaj testy przez `vitest`.

### Kryteria wykonania

- Pakiety budują się niezależnie.
- Żaden pakiet nie importuje z `servers/*`.
- Publiczne API idzie przez `src/index.ts`.

## Faza 2 - minimalny `@mcp-kit/core`

### Checklist

- [x] Zaimplementuj `createMcpApp`.
- [x] Zaimplementuj `defineTool`.
- [x] Zaimplementuj `defineResource`.
- [x] Zaimplementuj `definePrompt`.
- [x] Zaimplementuj `defineFeature`.
- [x] Zaimplementuj `createCapabilityRegistry`.
- [x] Dodaj typy `McpApp`, `Capability`, `ToolCapability`, `ResourceCapability`, `PromptCapability`, `CapabilityRegistry`.
- [x] Dodaj walidacje registry.
- [x] Dodaj helpery testowe `createTestApp`, `callTool`, `assertValidRegistry`.
- [x] Registry sortuje deterministycznie.
- [x] Błędne registry failuje testami.

### Zadania

Zaimplementuj:

```text
createMcpApp
defineTool
defineResource
definePrompt
defineFeature
createCapabilityRegistry
```

Dodaj typy:

```text
McpApp
Capability
ToolCapability
ResourceCapability
PromptCapability
CapabilityRegistry
```

Dodaj walidacje:

```text
unique capability names
deterministic sorting
stable naming convention
tool with structuredContent requires outputSchema
list_* tool requires limit
read/write annotations consistency
```

Dodaj test helpers:

```text
createTestApp
callTool
assertValidRegistry
```

### Kryteria wykonania

- Da się zdefiniować tool bez zależności od Node runtime.
- Da się zarejestrować capability w registry.
- Registry sortuje deterministycznie.
- Błędne registry failuje testami.

## Faza 3 - minimalny `@mcp-kit/node`

### Checklist

- [x] Zaimplementuj `startStdioServer(app)`.
- [x] Zaimplementuj `startHttpServer(app, options)`.
- [x] Zaimplementuj `loadRuntimeConfig()`.
- [x] Zaimplementuj `createLogger()`.
- [x] Zaimplementuj `resolveDataDir()`.
- [x] Zaimplementuj `atomicWrite()`.
- [x] Zaimplementuj `withLock()`.
- [x] Stdio nie pisze logów aplikacyjnych na stdout.
- [x] HTTP używa aplikacji z `@mcp-kit/core`.
- [x] Transporty są cienkimi adapterami.

### Zadania

Zaimplementuj:

```text
startStdioServer(app)
startHttpServer(app, options)
loadRuntimeConfig()
createLogger()
resolveDataDir()
atomicWrite()
withLock()
```

Transport stdio:

- nie pisze aplikacyjnych komunikatów na stdout,
- logi idą na stderr,
- cała logika domenowa jest poza transportem.

Transport HTTP:

- ma używać aplikacji stworzonej przez `@mcp-kit/core`,
- nie zawiera logiki domenowej,
- port bierze z konfiguracji.

### Kryteria wykonania

- Serwer można uruchomić po stdio.
- Serwer można uruchomić po HTTP.
- Transporty są cienkimi adapterami.

## Faza 4 - minimalny `@mcp-kit/cli`

### Checklist

- [x] Dodaj `mcp-kit init <path> --name <name>`.
- [x] `init` generuje bazową strukturę serwera.
- [x] Dodaj `mcp-kit quality`.
- [x] `quality` wykonuje sekwencję narzędzi z backlogu.
- [x] Dodaj pre-commit `pnpm quality`.
- [x] `mcp-kit init` generuje działający serwer.
- [x] `mcp-kit quality` działa w wygenerowanym serwerze.

### Zadania

Dodaj komendę:

```bash
mcp-kit init <path> --name <name>
```

`init` tworzy:

```text
src/app.ts
src/main.ts
src/mcp/registry.ts
src/server/transports/stdio.ts
src/server/transports/http.ts
src/features/health/index.ts
src/features/health/domain/health-status.ts
src/features/health/application/get-health.ts
src/features/health/mcp/health.tool.ts
test/architecture/project.architecture.test.ts
test/contracts/health.contract.test.ts
test/integration/app.smoke.test.ts
dependency-cruiser.config.cjs
eslint.config.js
knip.json
vitest.config.ts
```

Dodaj komendę:

```bash
mcp-kit quality
```

`quality` wykonuje dokładnie:

```text
knip
tsc --noEmit
eslint . --fix
dependency-cruiser
vitest run test/architecture
vitest run --coverage test/unit test/integration test/contracts
```

Dodaj automatyczne podpięcie pre-commit:

```text
pre-commit -> pnpm quality
```

### Kryteria wykonania

- `mcp-kit init` generuje działający serwer.
- `mcp-kit quality` działa w wygenerowanym serwerze.
- Pre-commit uruchamia `pnpm quality`.

## Faza 5 - testy architektoniczne frameworka

### Checklist

- [x] Dodaj `assertNoDependencyCycles`.
- [x] Dodaj `assertFeatureBoundaries`.
- [x] Dodaj `assertCleanArchitectureLayers`.
- [x] Dodaj `assertCapabilityRegistry`.
- [x] Dodaj `assertMcpAnnotations`.
- [x] Dodaj `assertToolSchemas`.
- [x] Naruszenie reguł failuje test.
- [x] Reguły są dostępne dla wygenerowanego serwera.

### Zadania

W `packages/core` dodaj helpery testów architektonicznych:

```text
assertNoDependencyCycles
assertFeatureBoundaries
assertCleanArchitectureLayers
assertCapabilityRegistry
assertMcpAnnotations
assertToolSchemas
```

Wygenerowany `test/architecture/project.architecture.test.ts` ma sprawdzać:

```text
domain nie importuje MCP SDK
application nie importuje mcp
application nie importuje infrastructure
mcp nie importuje infrastructure
feature import przez index.ts
brak cykli zależności
capability registry jest jawne i posortowane
tool ze structuredContent ma outputSchema
list_* ma limit
read/write policy jest spójne z annotations
```

### Kryteria wykonania

- Naruszenie dowolnej reguły failuje test.
- Reguły są używane przez wygenerowany serwer.

## Faza 6 - wygenerowanie serwera TERYT

### Checklist

- [x] Użyj własnego CLI do wygenerowania `servers/teryt`.
- [x] Ustal bounded context.
- [x] Dodaj `servers/teryt/docs/bounded-context.md`.
- [x] Dokument opisuje zakres TERYT MCP.
- [x] Dokument opisuje wykluczenia.
- [x] `servers/teryt` powstał przez framework.
- [x] `pnpm quality` przechodzi.
- [x] Braki generatora poprawione w generatorze.

### Zadania

Użyj własnego CLI:

```bash
mcp-kit init servers/teryt --name teryt-mcp
```

Ustal bounded context:

```text
Official Polish territorial registry lookup and synchronization
```

Dodaj dokument:

```text
servers/teryt/docs/bounded-context.md
```

Dokument ma mówić, że serwer obejmuje:

```text
TERC
SIMC
ULIC
WMRODZ
synchronizacja oficjalnych danych
wyszukiwanie i rozwiązywanie adresów do poziomu ulicy
```

Dokument ma mówić, że serwer nie obejmuje:

```text
REGON
BDL
PRG
geokodowania
map
nieoficjalnych danych adresowych
```

### Kryteria wykonania

- `servers/teryt` powstał przez framework.
- `pnpm quality` przechodzi.
- Jeśli generator czegoś nie umie, popraw generator, nie tylko ręcznie serwer.

## Faza 7 - `health` i `server_status`

### Checklist

- [x] Feature `health` zostaje jako minimalny przykład.
- [x] Dodaj feature `server_status`.
- [x] Dodaj strukturę `src/features/server-status`.
- [x] Dodaj tool `server_status`.
- [x] Tool zwraca server name, server version, framework version, transport, data dir i basic database status.
- [x] Tool ma `outputSchema`.
- [x] Tool jest read-only.
- [x] Tool jest zarejestrowany tylko w `src/mcp/registry.ts`.
- [x] `pnpm quality` przechodzi.

### Zadania

Feature `health` zostaje jako minimalny przykład.

Dodaj feature:

```text
server_status
```

Struktura:

```text
src/features/server-status/
  index.ts
  domain/
  application/
  mcp/
```

Tool:

```text
server_status
```

Ma zwracać:

```text
server name
server version
framework version
transport
data dir
database status basic
```

### Kryteria wykonania

- Tool ma `outputSchema`.
- Tool jest read-only.
- Tool jest zarejestrowany tylko w `src/mcp/registry.ts`.
- `pnpm quality` przechodzi.

## Faza 8 - `source_status`

### Checklist

- [x] Dodaj feature `source_status`.
- [x] Dodaj strukturę feature z domain/application/ports/mcp/infrastructure.
- [x] Tool zwraca local database status.
- [x] Tool zwraca remote source status.
- [x] Tool zwraca last checked at.
- [x] Tool zwraca last successful sync.
- [x] Tool zwraca `stateDate`.
- [x] Tool zwraca `sha256` jeśli znany.
- [x] Tool zwraca source errors.
- [x] Brak internetu nie psuje serwera.
- [x] Błąd remote source jest częścią statusu.
- [x] Ostatnia dobra baza pozostaje używalna.
- [x] `application` używa portów.
- [x] `mcp` nie importuje `infrastructure`.
- [x] `src/app.ts` składa use case z adapterami.
- [x] `pnpm quality` przechodzi.

### Zadania

Dodaj feature:

```text
source_status
```

Struktura:

```text
src/features/source-status/
  index.ts
  domain/
    dataset.ts
    source-snapshot.ts
  application/
    get-source-status.ts
    ports/
      teryt-source-catalog.ts
      manifest-store.ts
  mcp/
    source-status.tool.ts
  infrastructure/
    eteryt-source-catalog.ts
    json-manifest-store.ts
```

Tool:

```text
source_status
```

Ma zwracać:

```text
local database status
remote source status
last checked at
last successful sync
stateDate
sha256 if known
source errors
```

### Zasady

- Brak internetu nie psuje serwera.
- Błąd remote source jest częścią statusu.
- Ostatnia dobra baza pozostaje używalna.

### Kryteria wykonania

- `application` używa portów.
- `mcp` nie importuje `infrastructure`.
- `src/app.ts` składa use case z adapterami.
- `pnpm quality` przechodzi.

## Faza 9 - `sync_database`

### Checklist

- [x] Dodaj feature `sync_database`.
- [x] Dodaj input `mode: missing | stale | force`.
- [x] Dodaj strukturę `src/features/sync-database`.
- [ ] Zaimplementuj flow: download, hash, extract, parse, build tmp sqlite, validate, build indexes, atomic swap, write manifest.
- [x] Nieudany sync nie rusza ostatniej dobrej bazy.
- [x] Sync działa pod lockiem.
- [x] Nie ma równoległych synców.
- [ ] Dane pobierane są z oficjalnych źródeł GUS.
- [x] Tool ma `outputSchema`.
- [x] Tool ma write annotations.
- [x] `mode=missing` nie pobiera danych, jeśli baza istnieje.
- [x] `mode=force` buduje nową bazę atomowo.
- [x] `pnpm quality` przechodzi.

### Zadania

Dodaj feature:

```text
sync_database
```

Input:

```text
mode: missing | stale | force
```

Struktura:

```text
src/features/sync-database/
  index.ts
  domain/
    dataset.ts
    snapshot.ts
    sync-plan.ts
  application/
    plan-sync.ts
    sync-database.ts
    ports/
      teryt-source.ts
      file-store.ts
      database-builder.ts
      manifest-store.ts
      lock-store.ts
  mcp/
    sync-database.tool.ts
  infrastructure/
    eteryt-source.ts
    local-file-store.ts
    sqlite-database-builder.ts
    json-manifest-store.ts
    file-lock-store.ts
```

Flow:

```text
download
hash
extract
parse
build tmp sqlite
validate
build indexes
atomic swap
write manifest
```

### Zasady

- Nieudany sync nie rusza ostatniej dobrej bazy.
- Sync działa pod lockiem.
- Nie ma równoległych synców.
- Dane pobierane są z oficjalnych źródeł GUS.
- Publiczne API ws1 może być późniejszym providerem, ale nie jest defaultem.

### Kryteria wykonania

- Tool ma `outputSchema`.
- Tool ma write annotations.
- `mode=missing` nie pobiera danych, jeśli baza istnieje.
- `mode=force` buduje nową bazę atomowo.
- `pnpm quality` przechodzi.

## Faza 10 - import TERYT

### Checklist

- [x] Obsłuż dataset `TERC`.
- [x] Obsłuż dataset `SIMC`.
- [x] Obsłuż dataset `ULIC`.
- [x] Obsłuż dataset `WMRODZ`.
- [x] Obsłuż CSV.
- [x] Obsłuż ZIP.
- [x] Dodaj dataset detection.
- [x] Dodaj column validation.
- [x] Dodaj SQLite schema.
- [x] Kody są przechowywane jako `TEXT` bez utraty zer wiodących.
- [x] Manifest zapisuje dataset, variant, stateDate, downloadedAt, publishedAtObserved, sha256, recordCount, columns, source.
- [x] Dodaj walidacje wymaganych kolumn.
- [x] Dodaj walidacje `STAN_NA`.
- [x] Dodaj minimalne liczby rekordów.
- [x] Dodaj spójność podstawowych relacji.
- [x] Dodaj walidację hash pliku.
- [x] Dodaj walidację `recordCount`.
- [x] Import fixture działa.
- [ ] Import realnych plików jest możliwy.
- [x] `pnpm quality` przechodzi.

### Zadania

Obsłuż dataset:

```text
TERC
SIMC
ULIC
WMRODZ
```

Obsłuż:

```text
CSV
ZIP
dataset detection
column validation
```

SQLite schema:

```text
raw_terc
raw_simc
raw_ulic
raw_wmrodz
units
places
streets
metadata
units_fts
places_fts
streets_fts
```

Kody zawsze jako `TEXT`:

```text
WOJ
POW
GMI
RODZ
RODZ_GMI
SYM
SYMPOD
SYM_UL
RM
```

Manifest zapisuje:

```text
dataset
variant
stateDate
downloadedAt
publishedAtObserved
sha256
recordCount
columns
source
```

### Walidacje

Sprawdź:

```text
wymagane kolumny
STAN_NA
minimalne liczby rekordów
spójność podstawowych relacji
hash pliku
recordCount
```

### Kryteria wykonania

- Import fixture działa.
- Import realnych plików ma być możliwy.
- Baza nie traci zer wiodących.
- `pnpm quality` przechodzi.

## Faza 11 - wyszukiwanie

### Checklist

- [x] Dodaj `search_units`.
- [x] Dodaj `search_places`.
- [x] Dodaj `search_streets`.
- [x] Dodaj `resolve_address`.
- [x] Dodaj `get_unit`.
- [x] Dodaj `get_place`.
- [x] Dodaj `get_street`.
- [x] Każda feature ma domain/application/ports/mcp/infrastructure/index.ts.
- [x] Search tools mają `limit` default 20.
- [x] Search tools mają `limit` max 100.
- [x] Search tools mają `outputSchema`.
- [x] Search tools zwracają `structuredContent`.
- [x] Search tools zwracają `stateDate`, `matchedBy`, `confidence`.
- [x] Ranking obsługuje exact code.
- [x] Ranking obsługuje exact normalized name.
- [x] Ranking obsługuje prefix.
- [ ] Ranking obsługuje FTS.
- [x] `search_*` nie zwraca nieograniczonych list.
- [x] Każdy tool ma contract test.
- [x] Każdy repository jest za portem.
- [x] `pnpm quality` przechodzi po każdej feature.

### Zadania

Dodaj feature:

```text
search_units
search_places
search_streets
resolve_address
get_unit
get_place
get_street
```

Każda feature ma:

```text
domain
application
application/ports
mcp
infrastructure
index.ts
```

Search tools mają mieć:

```text
limit default 20
limit max 100
outputSchema
structuredContent
stateDate
matchedBy
confidence
```

Ranking:

```text
exact code
exact normalized name
prefix
FTS
fuzzy only later if needed
```

### Kryteria wykonania

- `search_*` nie zwraca nieograniczonych list.
- Każdy tool ma contract test.
- Każdy repository jest za portem.
- `pnpm quality` przechodzi po każdej feature.

## Faza 12 - CLI TERYT

### Checklist

- [ ] Dodaj `teryt-mcp serve`.
- [ ] Dodaj `teryt-mcp status`.
- [ ] Dodaj `teryt-mcp source-status`.
- [ ] Dodaj `teryt-mcp sync`.
- [ ] Dodaj `teryt-mcp search places Kraków`.
- [ ] CLI używa tych samych use case'ów co MCP.
- [ ] CLI nie ma osobnej logiki domenowej.
- [ ] CLI nie importuje prywatnych plików feature poza publicznym `index.ts`, chyba że jest composition rootem.
- [ ] CLI działa lokalnie.
- [ ] MCP i CLI zwracają spójne dane.
- [ ] `pnpm quality` przechodzi.

### Zadania

Dodaj CLI serwera TERYT:

```text
teryt-mcp serve
teryt-mcp status
teryt-mcp source-status
teryt-mcp sync
teryt-mcp search places Kraków
```

### Zasady

- CLI używa tych samych use case'ów co MCP.
- CLI nie ma osobnej logiki domenowej.
- CLI nie importuje prywatnych plików feature poza publicznym `index.ts`, chyba że jest composition rootem.

### Kryteria wykonania

- CLI działa lokalnie.
- MCP i CLI zwracają spójne dane.
- `pnpm quality` przechodzi.

## Faza 13 - kontrakty i testy

### Checklist

- [ ] Contract tests sprawdzają `inputSchema`.
- [ ] Contract tests sprawdzają `outputSchema`.
- [ ] Contract tests sprawdzają annotations.
- [ ] Contract tests sprawdzają `structuredContent`.
- [ ] Contract tests sprawdzają error shape.
- [x] Dodaj TERC fixture.
- [x] Dodaj SIMC fixture.
- [x] Dodaj ULIC fixture.
- [x] Dodaj WMRODZ fixture.
- [ ] Dodaj golden query `Kraków`.
- [ ] Dodaj golden query `Warszawa`.
- [ ] Dodaj golden query `Stara Wieś`.
- [ ] Dodaj golden query `Dąbrowa`.
- [ ] Dodaj golden query `Marszałkowska`.
- [ ] Dodaj integration test sync from fixtures.
- [ ] Dodaj integration test sqlite search.
- [ ] Dodaj integration test stdio roundtrip.
- [ ] Dodaj integration test http roundtrip.
- [ ] Testy kontraktowe obejmują każde publiczne capability.
- [ ] Integration tests obejmują minimalny realny flow.
- [ ] `pnpm quality` przechodzi.

### Zadania

Dodaj contract tests dla każdego toola:

```text
inputSchema
outputSchema
annotations
structuredContent
error shape
```

Dodaj fixtures małych plików TERYT:

```text
TERC fixture
SIMC fixture
ULIC fixture
WMRODZ fixture
```

Dodaj golden queries:

```text
Kraków
Warszawa
Stara Wieś
Dąbrowa
Marszałkowska
```

Dodaj integration tests:

```text
sync from fixtures
sqlite search
stdio roundtrip
http roundtrip
```

### Kryteria wykonania

- Testy kontraktowe obejmują każde publiczne capability.
- Integration tests obejmują minimalny realny flow.
- `pnpm quality` przechodzi.

## Faza 14 - dokumentacja

### Checklist

- [ ] Dodaj `docs/architecture/bounded-context.md`.
- [ ] Dodaj `docs/architecture/package-boundaries.md`.
- [ ] Dodaj `docs/architecture/runtime-ecosystem.md`.
- [ ] Dodaj `docs/architecture/feature-clean-architecture.md`.
- [ ] Dodaj `docs/quality.md`.
- [ ] Dodaj `docs/tutorial.md`.
- [ ] Dodaj `servers/teryt/docs/data-sync.md`.
- [ ] Dodaj `servers/teryt/docs/tools.md`.
- [ ] Dokumentacja opisuje `mcp-kit init`.
- [ ] Dokumentacja opisuje dodawanie feature.
- [ ] Dokumentacja opisuje `quality`.
- [ ] Dokumentacja opisuje testy architektoniczne.
- [ ] Dokumentacja opisuje sync TERYT.
- [ ] Dokumentacja opisuje źródła prawdy.
- [ ] Dokumentacja opisuje granice TERYT MCP.
- [ ] Nowy agent może zacząć pracę od dokumentacji.
- [ ] Tutorial prowadzi od pustego repo do działającego toola MCP.
- [ ] Dokumenty są spójne z wygenerowanym kodem.

### Zadania

Dodaj dokumenty:

```text
docs/architecture/bounded-context.md
docs/architecture/package-boundaries.md
docs/architecture/runtime-ecosystem.md
docs/architecture/feature-clean-architecture.md
docs/quality.md
docs/tutorial.md
servers/teryt/docs/bounded-context.md
servers/teryt/docs/data-sync.md
servers/teryt/docs/tools.md
```

Dokumentacja ma opisywać:

```text
jak stworzyć serwer przez mcp-kit init
jak dodać feature
jak działa quality
jak działają testy architektoniczne
jak działa sync TERYT
jakie dane są źródłem prawdy
jakie są granice TERYT MCP
```

### Kryteria wykonania

- Nowy agent może zacząć pracę od dokumentacji.
- Tutorial prowadzi od pustego repo do działającego toola MCP.
- Dokumenty są spójne z wygenerowanym kodem.

## Faza 15 - gotowość do wydzielenia frameworka

### Checklist

- [ ] Sprawdź, że `servers/teryt` używa tylko publicznych importów frameworka.
- [ ] Zablokuj publiczne `exports` w pakietach.
- [ ] Usuń API frameworka nieużywane przez TERYT.
- [ ] Dodaj release flow.
- [ ] Przygotuj `@mcp-kit/core` do publikacji.
- [ ] Przygotuj `@mcp-kit/node` do publikacji.
- [ ] Przygotuj `@mcp-kit/cli` do publikacji.
- [ ] Framework można przenieść do osobnego repo bez refaktoru TERYT.
- [ ] Serwer TERYT nie używa prywatnych ścieżek frameworka.
- [ ] `pnpm quality` przechodzi w root i w serwerze.

### Zadania

1. Sprawdź, że `servers/teryt` używa tylko publicznych importów:

```text
@mcp-kit/core
@mcp-kit/node
```

2. Zablokuj publiczne `exports` w pakietach.
3. Usuń API frameworka nieużywane przez TERYT.
4. Dodaj release flow:

```text
changesets albo prosty release script
```

5. Przygotuj pakiety do publikacji:

```text
@mcp-kit/core
@mcp-kit/node
@mcp-kit/cli
```

### Kryteria wykonania

- Framework można przenieść do osobnego repo bez refaktoru TERYT.
- Serwer TERYT nie używa prywatnych ścieżek frameworka.
- `pnpm quality` przechodzi w root i w serwerze.

## Twarde zasady pracy agenta

1. Po każdej zmianie frameworka użyj jej w `servers/teryt`.
2. Jeśli TERYT wymaga obejścia, najpierw sprawdź, czy powinno trafić do frameworka.
3. Jeśli kod jest specyficzny dla GUS albo TERYT, nie przenoś go do frameworka.
4. Jeśli framework ma API nieużywane przez TERYT, usuń je albo odłóż.
5. Nie twórz helperów `utils` bez konkretnego właściciela.
6. Nie twórz wspólnych abstrakcji tylko po to, żeby usunąć podobieństwo kodu.
7. Preferuj niski coupling nad agresywne DRY.
8. Po każdej większej fazie uruchom `pnpm quality`.
9. Jeśli `quality` failuje, napraw przyczynę, nie omijaj narzędzia.
10. Nie dodawaj nowych narzędzi jakości bez wyraźnego powodu.

## Minimalny Definition of Done

Praca jest gotowa, gdy:

```text
pnpm quality
```

przechodzi oraz:

```text
mcp-kit init
```

generuje działający serwer, a:

```text
servers/teryt
```

używa tego frameworka do uruchomienia co najmniej:

```text
health
server_status
source_status
sync_database
search_places
```

## Docelowy wynik

Docelowo repo ma zawierać:

1. Framework MCP Kit do tworzenia serwerów MCP.
2. CLI z `init` i `quality`.
3. Testy architektoniczne egzekwujące Clean Architecture i feature boundaries.
4. TERYT MCP jako pierwszy produkcyjny use case frameworka.
5. Architekturę gotową do wydzielenia frameworka do osobnych pakietów.

# TERYT MCP

Serwer MCP dla oficjalnego rejestru TERYT. Udostępnia dane GUS o jednostkach
terytorialnych, miejscowościach i ulicach jako narzędzia dla asystentów oraz
automatyzacji.

Obsługiwane zbiory:

- `TERC` - województwa, powiaty, gminy i typy jednostek;
- `SIMC` - miejscowości;
- `ULIC` - ulice;
- `WMRODZ` - słownik rodzajów miejscowości.

Pakiet npm: `teryt-mcp`.

## Typowe Pytania

To są najważniejsze zastosowania serwera.

### Znalezienie jednostki TERYT

Prompt:

```text
Znajdź identyfikator TERYT dla województwa dolnośląskiego.
```

Narzędzie: `search_units`

Input:

```json
{
  "query": "dolnoslaskie",
  "limit": 5
}
```

Odpowiedź ma postać:

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

### Znalezienie miejscowości

Prompt:

```text
Znajdź miejscowości SIMC o nazwie Kraków.
```

Narzędzie: `search_places`

Input:

```json
{
  "query": "Kraków",
  "limit": 5
}
```

Odpowiedź ma postać:

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

### Znalezienie ulicy

Prompt:

```text
Znajdź ulice ULIC o nazwie Marszałkowska.
```

Narzędzie: `search_streets`

Input:

```json
{
  "query": "Marszałkowska",
  "limit": 5
}
```

Odpowiedź ma postać:

```json
{
  "streets": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_name",
      "street": {
        "id": "0009876-00123",
        "code": "00123",
        "name": "Marszałkowska",
        "placeId": "0009876",
        "stateDate": "2026-01-01"
      }
    }
  ],
  "stateDate": "2026-01-01"
}
```

### Rozpoznanie miejscowości i ulicy z tekstu

Prompt:

```text
Rozpoznaj "Wieliszew Marszalkowska" i zwróć identyfikatory TERC, SIMC i ULIC.
```

Narzędzie: `resolve_address`

Input:

```json
{
  "query": "Wieliszew Marszalkowska",
  "limit": 5
}
```

Odpowiedź ma postać:

```json
{
  "addresses": [
    {
      "confidence": 0.95,
      "matchedBy": "exact_normalized_address",
      "address": {
        "id": "0008639-12400",
        "unit": {
          "id": "14-08-05-2",
          "name": "Wieliszew",
          "type": "gmina wiejska"
        },
        "place": {
          "id": "0008639",
          "name": "Wieliszew"
        },
        "street": {
          "id": "0008639-12400",
          "code": "12400",
          "name": "Marszałkowska"
        },
        "stateDate": "2026-06-19"
      }
    }
  ],
  "stateDate": "2026-06-19"
}
```

To nie jest geokodowanie. Narzędzie rozpoznaje identyfikatory rejestrowe do
poziomu miejscowości i ulicy. Dla zapytań zawierających wyłącznie miejscowość
użyj `search_places`. Kody pocztowe i numery budynków są odrzucane z czytelnym
błędem, ponieważ nie należą do TERYT.

### Sprawdzenie konkretnego identyfikatora

Prompt:

```text
Sprawdź jednostkę TERYT 02-01-01-1.
```

Narzędzie: `get_unit`

Input:

```json
{
  "id": "02-01-01-1"
}
```

Odpowiedź ma postać:

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

Dla brakującego identyfikatora odpowiedź ma postać:

```json
{
  "unit": null,
  "stateDate": null
}
```

Analogicznie:

- `get_place` sprawdza identyfikator SIMC miejscowości;
- `get_street` sprawdza identyfikator ULIC ulicy.

## Co Jest W TERYT, A Czego Nie Ma

Ten serwer celowo trzyma się TERYT. Dlatego obsługuje identyfikatory i nazwy
administracyjne, ale nie udaje geokodera ani rejestru adresów punktowych.

W zakresie TERYT:

- województwa, powiaty, gminy i ich typy;
- miejscowości i ich identyfikatory SIMC;
- ulice i ich identyfikatory ULIC;
- powiązania miejscowość-jednostka oraz ulica-miejscowość;
- daty stanu danych z lokalnej migawki.

Poza zakresem TERYT:

- współrzędne;
- działki;
- budynki;
- kody pocztowe;
- walidacja punktu adresowego, np. czy istnieje numer budynku przy ulicy.

Do tych danych potrzebne są inne źródła, np. PRG/EMUiA/GUGiK dla punktów
adresowych i współrzędnych, EGiB dla katastru albo osobny słownik PNA dla kodów
pocztowych. Jeśli te funkcje będą potrzebne, powinny powstać jako osobny serwer
lub osobny bounded context, nie jako ukryty dodatek do TERYT.

## Narzędzia MCP

Wszystkie narzędzia zwracają `structuredContent`.

### `about`

Zwraca informacje o pakiecie, autorze, kontakcie, repozytorium, wersji serwera
oraz stanie lokalnej synchronizacji danych.

Input:

```json
{}
```

Odpowiedź ma postać:

```json
{
  "author": {
    "name": "Maciej Ciemborowicz"
  },
  "contact": {
    "email": "maciej.ciemborowicz@gmail.com"
  },
  "repository": {
    "url": "https://github.com/ciembor/teryt-mcp"
  },
  "server": {
    "name": "teryt-mcp",
    "version": "0.1.10"
  },
  "data": {
    "status": "available",
    "synchronizedSuccessfully": true,
    "lastSynchronizedAt": "2026-06-21T00:00:00.000Z",
    "datasets": [
      {
        "dataset": "TERC",
        "stateDate": "2026-01-01",
        "version": "2026-01-01"
      }
    ]
  }
}
```

TERYT nie ma tu klasycznej wersji semver danych. Pole `version` jest datą
stanu danych `STAN_NA` z lokalnego manifestu synchronizacji.

### `health_status`

Sprawdza, czy serwer odpowiada.

Input:

```json
{}
```

Odpowiedź:

```json
{
  "ok": true
}
```

### `server_status`

Zwraca status runtime serwera.

Input:

```json
{}
```

Odpowiedź ma postać:

```json
{
  "serverName": "teryt-mcp",
  "serverVersion": "0.1.10",
  "frameworkVersion": "0.2.1",
  "transport": "stdio",
  "dataDir": "/path/to/teryt-data",
  "database": {
    "status": "available"
  }
}
```

### `source_status`

Pokazuje status lokalnej bazy i metadane źródeł TERYT.

Input:

```json
{}
```

Odpowiedź ma postać:

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

### `sync_database`

Buduje albo przebudowuje lokalną bazę SQLite z oficjalnych danych TERYT.

Input:

```json
{
  "mode": "missing"
}
```

Tryby:

```text
missing  zbuduj bazę tylko wtedy, gdy jej brakuje
stale    przebuduj bazę, jeśli ma co najmniej 24 godziny
force    przebuduj bazę pod lockiem
```

Jeśli baza już istnieje, a tryb to `missing`, odpowiedź ma postać:

```json
{
  "status": "skipped",
  "mode": "missing",
  "databasePath": null,
  "datasets": []
}
```

Po przebudowie odpowiedź ma postać:

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

### `search_units`

Szuka jednostek TERC.

Input:

```json
{
  "query": "Boleslawiec",
  "limit": 20
}
```

Zwraca:

```json
{
  "units": [],
  "stateDate": "2026-01-01"
}
```

### `search_places`

Szuka miejscowości SIMC.

Input:

```json
{
  "query": "Stara Wieś",
  "limit": 20
}
```

Zwraca:

```json
{
  "places": [],
  "stateDate": "2026-01-01"
}
```

### `search_streets`

Szuka ulic ULIC.

Input:

```json
{
  "query": "Marszałkowska",
  "limit": 20
}
```

Zwraca:

```json
{
  "streets": [],
  "stateDate": "2026-01-01"
}
```

### `resolve_address`

Szuka kandydata adresowego do poziomu miejscowości i ulicy.

Input:

```json
{
  "place": "Bolesławiec",
  "street": "Marszałkowska",
  "limit": 20
}
```

Można również przekazać `query`, np. `Marszalkowska Boleslawiec` albo
`ulica Marszalkowska w Boleslawiec`. Pola `place` i `street` są preferowane,
gdy klient potrafi rozdzielić miejscowość od ulicy.

Zwraca:

```json
{
  "addresses": [],
  "stateDate": "2026-01-01"
}
```

### `get_unit`

Pobiera jednostkę TERC po identyfikatorze.

Input:

```json
{
  "id": "02-01-01-1"
}
```

### `get_place`

Pobiera miejscowość SIMC po identyfikatorze.

Input:

```json
{
  "id": "0009876"
}
```

### `get_street`

Pobiera ulicę ULIC po identyfikatorze.

Input:

```json
{
  "id": "0009876-00123"
}
```

## Dopasowanie I Ranking

`matchedBy` mówi, dlaczego wynik został zwrócony:

```text
exact_code
exact_normalized_name
exact_normalized_address
prefix
contains
```

`confidence` jest wynikiem rankingu wyszukiwania, a nie oficjalną wartością z
rejestru. Dopasowanie po dokładnym kodzie ma najwyższy priorytet. Dopasowania
zawierające szukany fragment są niżej.

Wyszukiwanie normalizuje polskie znaki, więc zapytania takie jak `Boleslawiec`
mogą znaleźć `Bolesławiec`.

## Instalacja

Uruchomienie bez instalacji globalnej:

```bash
npx -y teryt-mcp serve
```

Instalacja globalna:

```bash
npm install -g teryt-mcp
teryt-mcp serve
```

Wymagania:

- Node.js `>=20.19.0`

Podczas instalacji pakiet próbuje utworzyć lokalną bazę SQLite z oficjalnych
danych TERYT. Jeśli pierwsza synchronizacja się nie powiedzie, instalacja nadal
kończy się sukcesem. Bazę można zsynchronizować później przez CLI albo narzędzie
`sync_database`.

Pominięcie synchronizacji podczas instalacji:

```bash
TERYT_MCP_SKIP_POSTINSTALL_SYNC=1 npm install -g teryt-mcp
```

## Podłączenie Do Klienta MCP

Konfiguracja dla transportu stdio:

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

Przy instalacji globalnej:

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

W środowisku, które czyści cache między uruchomieniami, ustaw stały katalog
danych:

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

### Codex

Codex CLI i rozszerzenie Codex dla IDE współdzielą konfigurację
`~/.codex/config.toml`. Plik VS Code `User/mcp.json` nie rejestruje serwera w
Codex.

Najprościej dodać globalnie zainstalowany serwer poleceniem:

```bash
codex mcp add teryt-mcp -- teryt-mcp serve
```

Odpowiednik w `~/.codex/config.toml`:

```toml
[mcp_servers.teryt-mcp]
command = "teryt-mcp"
args = ["serve"]
```

Po zmianie konfiguracji uruchom nowy proces lub nową sesję Codex i sprawdź
serwer przez `codex mcp list` albo `/mcp` w interfejsie terminalowym.

## Pierwsza Synchronizacja

Serwer może zwracać status bez lokalnej bazy, ale wyszukiwanie i lookupy
wymagają bazy SQLite.

Wymuszenie synchronizacji:

```bash
npx -y teryt-mcp sync --force
```

Albo, przy instalacji globalnej:

```bash
teryt-mcp sync --force
```

Synchronizacja zapisuje bazę atomowo. Proces czytający powinien zobaczyć albo
starą bazę, albo nową, nigdy częściowo zapisany plik.

## CLI

CLI jest pomocnicze. Pełny zestaw funkcji jest dostępny przez MCP.

```bash
teryt-mcp serve
teryt-mcp status
teryt-mcp source-status
teryt-mcp sync
teryt-mcp sync --force
teryt-mcp sync --mode missing
teryt-mcp search places Kraków --limit 5
```

Obecnie CLI obsługuje wyszukiwanie tylko dla `search places`. Narzędzia MCP
udostępniają również jednostki, ulice, rozpoznawanie adresu i lookupy po
identyfikatorach.

Przykład:

```bash
teryt-mcp search places Boleslawiec --limit 1
```

Odpowiedź ma postać:

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

## HTTP

HTTP jest przydatne do lokalnego testowania albo własnych wrapperów:

```bash
MCP_TRANSPORT=http PORT=3000 teryt-mcp serve
```

Endpointy:

```text
GET  /health
POST /tools/:toolName
```

Przykład:

```bash
curl -s http://127.0.0.1:3000/tools/search_places \
  -H 'content-type: application/json' \
  -d '{"query":"Kraków","limit":3}'
```

Odpowiedź HTTP zawiera wynik narzędzia MCP:

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

## Konfiguracja Runtime

```text
MCP_TRANSPORT=stdio|http  # domyślnie stdio
MCP_PORT / PORT           # domyślnie 3000 dla HTTP
MCP_DATA_DIR              # katalog bazy i manifestu synchronizacji
XDG_CACHE_HOME            # używane, gdy MCP_DATA_DIR nie jest ustawione
MCP_LOG_LEVEL             # debug|info|warn|error|silent
```

Pliki lokalne:

```text
<data-dir>/teryt.sqlite
<data-dir>/sync-manifest.json
<data-dir>/*.lock
```

Nowe wydania mogą zmieniać schemat SQLite. Serwer wykrywa niezgodną bazę i
przebudowuje ją podczas synchronizacji w trybie `missing`; można też jawnie
uruchomić `teryt-mcp sync --force`.

## Development

Dla osób rozwijających repozytorium:

```bash
pnpm install
pnpm build
pnpm quality
```

Szczegóły architektury i kontraktów:

- [docs/tools.md](docs/tools.md)
- [docs/data-sync.md](docs/data-sync.md)
- [docs/architecture/feature-clean-architecture.md](docs/architecture/feature-clean-architecture.md)
- [docs/architecture/runtime-ecosystem.md](docs/architecture/runtime-ecosystem.md)

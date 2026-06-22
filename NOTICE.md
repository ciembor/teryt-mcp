# Informacje prawne i źródła danych

## Oprogramowanie

Copyright 2026 Maciej Ciemborowicz.

Kod źródłowy projektu TERYT MCP jest udostępniany wyłącznie na warunkach
European Union Public Licence, wersja 1.2 (`EUPL-1.2 only`). Pełna treść
licencji znajduje się w pliku `LICENSE`.

## Dane TERYT

Projekt pobiera i przetwarza informacje sektora publicznego z rejestru TERYT,
którego źródłem jest Główny Urząd Statystyczny:

https://eteryt.stat.gov.pl/

Data wytworzenia danych jest zapisywana osobno dla każdego zbioru jako
`stateDate`. Data ich pozyskania jest zapisywana w manifeście synchronizacji
jako `downloadedAt` i jest dostępna przez narzędzia informacyjne serwera.

Przetwarzanie obejmuje pobranie oficjalnych zbiorów TERC, SIMC, ULIC i WMRODZ,
odczyt danych źródłowych, normalizację pól tekstowych oraz utworzenie lokalnej
bazy SQLite i indeksów wyszukiwania. Projekt nie modyfikuje źródłowych
identyfikatorów TERYT.

Główny Urząd Statystyczny nie ponosi odpowiedzialności za rezultaty
przetworzenia informacji ponownie wykorzystywanej.

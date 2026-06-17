export const terytSqliteSchema = [
  `CREATE TABLE raw_terc (
    WOJ TEXT,
    POW TEXT,
    GMI TEXT,
    RODZ TEXT,
    NAZWA TEXT,
    NAZDOD TEXT,
    STAN_NA TEXT
  )`,
  `CREATE TABLE raw_simc (
    WOJ TEXT,
    POW TEXT,
    GMI TEXT,
    RODZ_GMI TEXT,
    RM TEXT,
    MZ TEXT,
    NAZWA TEXT,
    SYM TEXT,
    SYMPOD TEXT,
    STAN_NA TEXT
  )`,
  `CREATE TABLE raw_ulic (
    WOJ TEXT,
    POW TEXT,
    GMI TEXT,
    RODZ_GMI TEXT,
    SYM TEXT,
    SYM_UL TEXT,
    CECHA TEXT,
    NAZWA_1 TEXT,
    NAZWA_2 TEXT,
    STAN_NA TEXT
  )`,
  `CREATE TABLE raw_wmrodz (
    RM TEXT,
    NAZWA_RM TEXT,
    STAN_NA TEXT
  )`,
  `CREATE TABLE units (
    id TEXT PRIMARY KEY,
    WOJ TEXT,
    POW TEXT,
    GMI TEXT,
    RODZ TEXT,
    name TEXT,
    type TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE places (
    id TEXT PRIMARY KEY,
    SYM TEXT,
    SYMPOD TEXT,
    RM TEXT,
    name TEXT,
    unitId TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE streets (
    id TEXT PRIMARY KEY,
    SYM TEXT,
    SYM_UL TEXT,
    name TEXT,
    placeId TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  "CREATE VIRTUAL TABLE units_fts USING fts5(name, content='units', content_rowid='rowid')",
  "CREATE VIRTUAL TABLE places_fts USING fts5(name, content='places', content_rowid='rowid')",
  "CREATE VIRTUAL TABLE streets_fts USING fts5(name, content='streets', content_rowid='rowid')",
] as const;

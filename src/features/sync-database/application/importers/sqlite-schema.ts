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
    normalizedName TEXT,
    type TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE places (
    id TEXT PRIMARY KEY,
    SYM TEXT,
    SYMPOD TEXT,
    RM TEXT,
    name TEXT,
    normalizedName TEXT,
    unitId TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE streets (
    id TEXT PRIMARY KEY,
    SYM TEXT,
    SYM_UL TEXT,
    name TEXT,
    normalizedName TEXT,
    placeId TEXT,
    stateDate TEXT
  )`,
  `CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  "CREATE INDEX units_normalized_name_idx ON units(normalizedName)",
  "CREATE INDEX places_normalized_name_idx ON places(normalizedName)",
  "CREATE INDEX streets_normalized_name_idx ON streets(normalizedName)",
] as const;

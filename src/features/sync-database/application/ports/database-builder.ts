import type { TerytImport } from "../importers/teryt-csv.js";

export type BuiltDatabase = {
  readonly content: Uint8Array;
};

export type DatabaseBuilder = {
  readonly build: (imports: readonly TerytImport[]) => Promise<BuiltDatabase>;
};

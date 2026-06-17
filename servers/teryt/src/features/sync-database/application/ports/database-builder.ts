import type { SourceFile } from "./teryt-source.js";

export type BuiltDatabase = {
  readonly content: Uint8Array;
};

export type DatabaseBuilder = {
  readonly build: (sourceFiles: readonly SourceFile[]) => Promise<BuiltDatabase>;
};

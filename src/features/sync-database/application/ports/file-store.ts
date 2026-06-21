export type FileStore = {
  readonly databaseExists: () => Promise<boolean>;
  readonly databaseModifiedAt: () => Promise<Date | null>;
  readonly databaseSchemaVersion: () => Promise<number | null>;
  readonly swapDatabase: (content: Uint8Array) => Promise<string>;
};

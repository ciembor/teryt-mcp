export type FileStore = {
  readonly databaseExists: () => Promise<boolean>;
  readonly swapDatabase: (content: Uint8Array) => Promise<string>;
};

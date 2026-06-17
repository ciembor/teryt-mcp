export type LockStore = {
  readonly withSyncLock: <T>(callback: () => Promise<T>) => Promise<T>;
};

import type { Street } from "../../domain/street.js";

export type StreetRepository = {
  readonly findStreets: (query: string, limit: number) => Promise<readonly Street[]>;
};

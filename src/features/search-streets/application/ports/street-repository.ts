import type { Street } from "../../domain/street.js";

export type StreetRepository = {
  readonly listStreets: () => Promise<readonly Street[]>;
};

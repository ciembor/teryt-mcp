import type { StreetDetails } from "../../domain/street-details.js";

export type StreetDetailsRepository = {
  readonly getStreet: (id: string) => Promise<StreetDetails | null>;
};

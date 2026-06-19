import type { PlaceDetails } from "../../domain/place-details.js";

export type PlaceDetailsRepository = {
  readonly getPlace: (id: string) => Promise<PlaceDetails | null>;
};

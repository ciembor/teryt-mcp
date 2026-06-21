export type Street = {
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly placeId: string;
  readonly stateDate: string;
};

export type StreetMatch = {
  readonly confidence: number;
  readonly matchedBy: SearchMatchKind;
  readonly street: Street;
};
import type { SearchMatchKind } from "../../../shared/search-entities.js";

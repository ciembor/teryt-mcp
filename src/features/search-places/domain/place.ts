export type Place = {
  readonly id: string;
  readonly name: string;
  readonly stateDate: string;
  readonly unitId: string;
};

export type PlaceMatch = {
  readonly confidence: number;
  readonly matchedBy: SearchMatchKind;
  readonly place: Place;
};
import type { SearchMatchKind } from "../../../shared/search-entities.js";

export type Unit = {
  readonly id: string;
  readonly name: string;
  readonly stateDate: string;
  readonly type: string;
};

export type UnitMatch = {
  readonly confidence: number;
  readonly matchedBy: SearchMatchKind;
  readonly unit: Unit;
};
import type { SearchMatchKind } from "../../../shared/search-entities.js";

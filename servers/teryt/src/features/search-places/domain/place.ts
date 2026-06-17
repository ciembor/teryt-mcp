export type Place = {
  readonly id: string;
  readonly name: string;
  readonly stateDate: string;
  readonly unitId: string;
};

export type PlaceMatch = {
  readonly confidence: number;
  readonly matchedBy: "exact_code" | "exact_normalized_name" | "prefix" | "fts";
  readonly place: Place;
};

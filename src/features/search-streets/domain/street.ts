export type Street = {
  readonly code: string;
  readonly id: string;
  readonly name: string;
  readonly placeId: string;
  readonly stateDate: string;
};

export type StreetMatch = {
  readonly confidence: number;
  readonly matchedBy: "exact_code" | "exact_normalized_name" | "prefix" | "contains";
  readonly street: Street;
};

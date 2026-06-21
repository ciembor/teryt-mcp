export type AddressUnit = {
  readonly id: string;
  readonly name: string;
  readonly type: string;
};

export type AddressPlace = {
  readonly id: string;
  readonly name: string;
};

export type AddressStreet = {
  readonly code: string;
  readonly id: string;
  readonly name: string;
};

export type ResolvedAddress = {
  readonly id: string;
  readonly place: AddressPlace;
  readonly stateDate: string;
  readonly street: AddressStreet;
  readonly unit: AddressUnit;
};

export type AddressMatch = {
  readonly address: ResolvedAddress;
  readonly confidence: number;
  readonly matchedBy: "exact_code" | "exact_normalized_address" | "prefix";
};

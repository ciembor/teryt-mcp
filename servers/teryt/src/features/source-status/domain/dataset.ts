export type DatasetCode = "TERC" | "SIMC" | "ULIC" | "WMRODZ";

export type Dataset = {
  readonly code: DatasetCode;
  readonly name: string;
  readonly sourceUrl: string;
};

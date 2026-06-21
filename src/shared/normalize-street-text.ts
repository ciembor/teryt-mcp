import { normalizePolishText } from "./normalize-polish-text.js";

const streetTypeWords = new Set([
  "al",
  "aleja",
  "aleje",
  "alei",
  "os",
  "osiedle",
  "pl",
  "plac",
  "rondo",
  "skwer",
  "ul",
  "ulica",
  "ulice",
  "ulicy",
]);

export function normalizeStreetText(value: string): string {
  return normalizePolishText(value)
    .replaceAll(/[.,:;()\n\r\t]/g, " ")
    .split(" ")
    .filter((word) => word && !streetTypeWords.has(word))
    .join(" ");
}

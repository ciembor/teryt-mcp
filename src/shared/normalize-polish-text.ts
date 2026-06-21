export function normalizePolishText(value: string): string {
  return value
    .replaceAll("ł", "l")
    .replaceAll("Ł", "L")
    .normalize("NFKD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pl-PL");
}

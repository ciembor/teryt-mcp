const monthNames = new Set([
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
]);

export function assertSupportedAddressText(...values: readonly (string | undefined)[]): void {
  const tokens = values.flatMap((value) => tokenizeAddressInput(value));

  if (tokens.some(isPostalCode)) {
    throw new Error("resolve_address does not support postal codes. Provide only the locality and street.");
  }

  if (tokens.some((token, index) => isBuildingNumber(token, index, tokens))) {
    throw new Error("resolve_address does not validate building numbers. Provide only the locality and street.");
  }
}

function tokenizeAddressInput(value: string | undefined): readonly string[] {
  return value?.split(/\s+/).map(cleanToken).filter(Boolean) ?? [];
}

function cleanToken(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && !isTokenCharacter(value[start])) {
    start += 1;
  }

  while (end > start && !isTokenCharacter(value[end - 1])) {
    end -= 1;
  }

  return value.slice(start, end);
}

function isTokenCharacter(value: string | undefined): boolean {
  return value !== undefined && (isDigit(value) || isLetter(value));
}

function isLetter(value: string): boolean {
  return value.toLocaleLowerCase("pl-PL") !== value.toLocaleUpperCase("pl-PL");
}

function isPostalCode(value: string): boolean {
  return (
    value.length === 6 &&
    value[2] === "-" &&
    [...value.slice(0, 2), ...value.slice(3)].every(isDigit)
  );
}

function isBuildingNumber(value: string, index: number, tokens: readonly string[]): boolean {
  const next = tokens[index + 1];

  return (
    index === tokens.length - 1 &&
    isDigit(value[0]) &&
    !value.includes("-") &&
    !monthNames.has(next?.toLocaleLowerCase("pl-PL") ?? "")
  );
}

function isDigit(value: string | undefined): boolean {
  return value !== undefined && value >= "0" && value <= "9";
}

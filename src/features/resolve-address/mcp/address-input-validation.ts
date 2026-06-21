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
  const tokens = values.flatMap((value) => value?.split(" ").filter(Boolean) ?? []);

  if (tokens.some(isPostalCode)) {
    throw new Error("resolve_address does not support postal codes. Provide only the locality and street.");
  }

  if (tokens.some((token, index) => isBuildingNumber(token, tokens[index + 1]))) {
    throw new Error("resolve_address does not validate building numbers. Provide only the locality and street.");
  }
}

function isPostalCode(value: string): boolean {
  return (
    value.length === 6 &&
    value[2] === "-" &&
    [...value.slice(0, 2), ...value.slice(3)].every(isDigit)
  );
}

function isBuildingNumber(value: string, next: string | undefined): boolean {
  return isDigit(value[0]) && !value.includes("-") && !monthNames.has(next?.toLocaleLowerCase("pl-PL") ?? "");
}

function isDigit(value: string | undefined): boolean {
  return value !== undefined && value >= "0" && value <= "9";
}

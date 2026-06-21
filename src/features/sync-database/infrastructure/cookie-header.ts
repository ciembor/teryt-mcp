export function extractCookieHeader(headers: Headers): string {
  const rawCookies = headers.get("set-cookie");

  if (!rawCookies) {
    return "";
  }

  return splitSetCookieHeader(rawCookies)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter((cookie) => cookie)
    .join("; ");
}

function splitSetCookieHeader(value: string): readonly string[] {
  const cookies: string[] = [];
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "," || !isCookieBoundary(value, index + 1)) {
      continue;
    }

    cookies.push(value.slice(start, index));
    start = index + 1;
  }

  cookies.push(value.slice(start));

  return cookies;
}

function isCookieBoundary(value: string, start: number): boolean {
  let index = start;

  while (value[index] === " ") {
    index += 1;
  }

  const semicolonIndex = value.indexOf(";", index);
  const equalsIndex = value.indexOf("=", index);

  return equalsIndex >= 0 && (semicolonIndex < 0 || equalsIndex < semicolonIndex);
}

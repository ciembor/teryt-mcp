import { describe, expect, it } from "vitest";

import { extractCookieHeader } from "../../src/features/sync-database/infrastructure/cookie-header.js";

describe("extractCookieHeader", () => {
  it("keeps cookie pairs while handling commas in expiry dates", () => {
    const headers = new Headers();
    headers.append("set-cookie", "session=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/");
    headers.append("set-cookie", "token=xyz; Path=/; HttpOnly");

    expect(extractCookieHeader(headers)).toBe("session=abc; token=xyz");
  });

  it("returns an empty header when no cookies are present", () => {
    expect(extractCookieHeader(new Headers())).toBe("");
  });
});

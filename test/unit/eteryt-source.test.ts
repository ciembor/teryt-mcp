import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { EterytSource } from "../../src/features/sync-database/infrastructure/eteryt-source.js";

describe("EterytSource", () => {
  it("downloads a dataset through the official eTeryt postback form", async () => {
    const requests: [URL | RequestInfo, RequestInit | undefined][] = [];
    const zip = zipSync({
      "TERC.csv": strToU8("WOJ;POW;GMI;RODZ;NAZWA;NAZDOD;STAN_NA\n02;01;01;1;Bolesławiec;gmina miejska;2026-01-01"),
    });
    const source = new EterytSource(async (url, init) => {
      requests.push([url, init]);

      if (!init) {
        return new Response(
          [
            '<input type="hidden" name="__VIEWSTATE" value="view&amp;state" />',
            '<input type="hidden" name="__VIEWSTATEGENERATOR" value="generator" />',
          ].join(""),
          {
            headers: {
              "set-cookie": "ASP.NET_SessionId=session-id; path=/; HttpOnly",
            },
          },
        );
      }

      return new Response(zip, {
        headers: {
          "content-type": "application/zip",
        },
      });
    });

    const result = await source.download("TERC");

    expect(result.dataset).toBe("TERC");
    expect(result.content).toEqual(zip);
    expect(result.sourceUrl).toContain("pliki_pelne.aspx#TERC");
    expect(requests).toHaveLength(2);
    expect(String(requests[1]?.[1]?.body)).toContain("__EVENTTARGET=ctl00%24body%24BTERCAdresowyPobierz");
    expect(requests[1]?.[1]?.headers).toMatchObject({
      cookie: "ASP.NET_SessionId=session-id",
    });
  });

  it("rejects HTML error pages returned instead of dataset files", async () => {
    const source = new EterytSource(async (_url, init) =>
      init
        ? new Response("<html></html>", {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          })
        : new Response('<input type="hidden" name="__VIEWSTATE" value="view" />'),
    );

    await expect(source.download("SIMC")).rejects.toThrow(/HTML/);
  });
});

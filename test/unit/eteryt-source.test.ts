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

      if (init?.method !== "POST") {
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
    expect(requests[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(requests[1]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(String(requests[1]?.[1]?.body)).toContain("__EVENTTARGET=ctl00%24body%24BTERCUrzedowyPobierz");
    expect(requests[1]?.[1]?.headers).toMatchObject({
      cookie: "ASP.NET_SessionId=session-id",
    });
  });

  it("retries transient fetch failures", async () => {
    let attempts = 0;
    const zip = zipSync({
      "TERC.csv": strToU8("WOJ;POW;GMI;RODZ;NAZWA;NAZDOD;STAN_NA\n02;01;01;1;Bolesławiec;gmina miejska;2026-01-01"),
    });
    const source = new EterytSource(async (_url, init) => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error("temporary network error");
      }

      if (init?.method !== "POST") {
        return new Response('<input type="hidden" name="__VIEWSTATE" value="view" />');
      }

      return new Response(zip, {
        headers: {
          "content-type": "application/zip",
        },
      });
    });

    await expect(source.download("TERC")).resolves.toMatchObject({
      dataset: "TERC",
    });
    expect(attempts).toBe(3);
  });

  it("rejects HTML error pages returned instead of dataset files", async () => {
    const source = new EterytSource(async (_url, init) =>
      init?.method === "POST"
        ? new Response("<html></html>", {
            headers: {
              "content-type": "text/html; charset=utf-8",
            },
          })
        : new Response('<input type="hidden" name="__VIEWSTATE" value="view" />'),
    );

    await expect(source.download("SIMC")).rejects.toThrow(/HTML/);
  });

  it("rejects HTML error pages with a misleading content type", async () => {
    const source = new EterytSource(async (_url, init) =>
      init?.method === "POST"
        ? new Response("<!DOCTYPE html><html></html>", {
            headers: {
              "content-type": "application/octet-stream",
            },
          })
        : new Response('<input type="hidden" name="__VIEWSTATE" value="view" />'),
    );

    await expect(source.download("TERC")).rejects.toThrow(/HTML/);
  });
});

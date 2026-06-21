import type { SourceFile, TerytSource } from "../application/ports/teryt-source.js";
import type { DatasetCode } from "../domain/dataset.js";
import { createAspNetPostbackForm } from "./aspnet-form.js";
import { extractCookieHeader } from "./cookie-header.js";
import { fetchWithRetry } from "./eteryt-fetch.js";

type Fetch = typeof fetch;

const DOWNLOAD_PAGE_URL =
  "https://eteryt.stat.gov.pl/eTeryt/rejestr_teryt/udostepnianie_danych/baza_teryt/uzytkownicy_indywidualni/pobieranie/pliki_pelne.aspx";

const eventTargets: Readonly<Record<DatasetCode, string>> = {
  SIMC: "ctl00$body$BSIMCUrzedowyPobierz",
  TERC: "ctl00$body$BTERCUrzedowyPobierz",
  ULIC: "ctl00$body$BULICUrzedowyPobierz",
  WMRODZ: "ctl00$body$BRodzMiejPobierz",
};

export class EterytSource implements TerytSource {
  constructor(private readonly fetchFn: Fetch = fetch) {}

  async download(dataset: DatasetCode): Promise<SourceFile> {
    const page = await this.fetchPage();
    const content = await this.postDownload(page, eventTargets[dataset]);

    return {
      content,
      dataset,
      sourceUrl: `${DOWNLOAD_PAGE_URL}#${dataset}`,
      stateDate: "unknown",
    };
  }

  private async fetchPage(): Promise<{ readonly cookies: string; readonly html: string }> {
    const response = await fetchWithRetry(this.fetchFn, DOWNLOAD_PAGE_URL);

    if (!response.ok) {
      throw new Error(`Cannot load eTeryt download page: HTTP ${response.status}.`);
    }

    return {
      cookies: extractCookieHeader(response.headers),
      html: await response.text(),
    };
  }

  private async postDownload(page: { readonly cookies: string; readonly html: string }, eventTarget: string) {
    const form = createAspNetPostbackForm(page.html, eventTarget);

    const response = await fetchWithRetry(this.fetchFn, DOWNLOAD_PAGE_URL, {
      body: form,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(page.cookies ? { cookie: page.cookies } : {}),
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Cannot download eTeryt dataset: HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const content = new Uint8Array(await response.arrayBuffer());

    if (contentType.includes("text/html") || looksLikeHtml(content)) {
      throw new Error("eTeryt returned HTML instead of a dataset file.");
    }

    return content;
  }
}

function looksLikeHtml(content: Uint8Array): boolean {
  const prefix = new TextDecoder().decode(content.subarray(0, 256)).trimStart().toLowerCase();

  return prefix.startsWith("<!doctype html") || prefix.startsWith("<html");
}

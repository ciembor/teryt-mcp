import type { DatasetCode } from "../domain/dataset.js";
import type { SourceFile, TerytSource } from "../application/ports/teryt-source.js";

type Fetch = typeof fetch;

const DOWNLOAD_PAGE_URL =
  "https://eteryt.stat.gov.pl/eTeryt/rejestr_teryt/udostepnianie_danych/baza_teryt/uzytkownicy_indywidualni/pobieranie/pliki_pelne.aspx";

const eventTargets: Readonly<Record<DatasetCode, string>> = {
  SIMC: "ctl00$body$BSIMCUrzedowyPobierz",
  TERC: "ctl00$body$BTERCAdresowyPobierz",
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
    const response = await this.fetchFn(DOWNLOAD_PAGE_URL);

    if (!response.ok) {
      throw new Error(`Cannot load eTeryt download page: HTTP ${response.status}.`);
    }

    return {
      cookies: extractCookies(response.headers),
      html: await response.text(),
    };
  }

  private async postDownload(page: { readonly cookies: string; readonly html: string }, eventTarget: string) {
    const form = parseHiddenInputs(page.html);

    form.set("__EVENTTARGET", eventTarget);
    form.set("__EVENTARGUMENT", "");

    const response = await this.fetchFn(DOWNLOAD_PAGE_URL, {
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

    if (contentType.includes("text/html")) {
      throw new Error("eTeryt returned HTML instead of a dataset file.");
    }

    return new Uint8Array(await response.arrayBuffer());
  }
}

function parseHiddenInputs(html: string): URLSearchParams {
  const form = new URLSearchParams();

  for (const input of findInputTags(html)) {
    const name = getAttribute(input, "name");

    if (getAttribute(input, "type")?.toLowerCase() === "hidden" && name) {
      form.set(name, decodeHtmlEntities(getAttribute(input, "value") ?? ""));
    }
  }

  return form;
}

function findInputTags(html: string): readonly string[] {
  const inputs: string[] = [];
  let searchFrom = 0;
  let start = html.toLowerCase().indexOf("<input", searchFrom);

  while (start >= 0) {
    const end = html.indexOf(">", start);

    if (end < 0) {
      break;
    }

    inputs.push(html.slice(start, end + 1));
    searchFrom = end + 1;
    start = html.toLowerCase().indexOf("<input", searchFrom);
  }

  return inputs;
}

function getAttribute(input: string, name: string): string | null {
  const marker = `${name}=`;
  const markerIndex = input.toLowerCase().indexOf(marker.toLowerCase());

  if (markerIndex < 0) {
    return null;
  }

  const quote = input[markerIndex + marker.length];

  if (quote !== '"' && quote !== "'") {
    return null;
  }

  const valueStart = markerIndex + marker.length + 1;
  const valueEnd = input.indexOf(quote, valueStart);

  if (valueEnd < 0) {
    return null;
  }

  return input.slice(valueStart, valueEnd);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractCookies(headers: Headers): string {
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

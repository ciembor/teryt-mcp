import type { Dataset } from "../domain/dataset.js";
import type { TerytSourceCatalog } from "../application/ports/teryt-source-catalog.js";

const SOURCE_URL = "https://eteryt.stat.gov.pl/eTeryt/";

export class EterytSourceCatalog implements TerytSourceCatalog {
  constructor(
    private readonly fetchImplementation: typeof fetch = globalThis.fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async checkAvailability() {
    const checkedAt = this.now().toISOString();

    try {
      const response = await this.fetchImplementation(SOURCE_URL, {
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        return { checkedAt, errors: [`eTeryt returned HTTP ${response.status}.`], status: "error" as const };
      }

      return { checkedAt, errors: [], status: "available" as const };
    } catch (error) {
      return {
        checkedAt,
        errors: [error instanceof Error ? error.message : String(error)],
        status: "error" as const,
      };
    }
  }

  async listDatasets(): Promise<readonly Dataset[]> {
    return [
      {
        code: "TERC",
        name: "Territorial units",
        sourceUrl: SOURCE_URL,
      },
      {
        code: "SIMC",
        name: "Localities",
        sourceUrl: SOURCE_URL,
      },
      {
        code: "ULIC",
        name: "Streets",
        sourceUrl: SOURCE_URL,
      },
      {
        code: "WMRODZ",
        name: "Locality type dictionary",
        sourceUrl: SOURCE_URL,
      },
    ];
  }
}

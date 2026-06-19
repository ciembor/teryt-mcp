import type { Dataset } from "../domain/dataset.js";
import type { TerytSourceCatalog } from "../application/ports/teryt-source-catalog.js";

const SOURCE_URL = "https://eteryt.stat.gov.pl/eTeryt/";

export class EterytSourceCatalog implements TerytSourceCatalog {
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

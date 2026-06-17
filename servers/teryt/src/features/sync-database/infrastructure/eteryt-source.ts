import { TextEncoder } from "node:util";

import type { DatasetCode } from "../domain/dataset.js";
import type { SourceFile, TerytSource } from "../application/ports/teryt-source.js";

const SOURCE_URL = "https://eteryt.stat.gov.pl/eTeryt/";

export class EterytSource implements TerytSource {
  async download(dataset: DatasetCode): Promise<SourceFile> {
    return {
      content: new TextEncoder().encode(`${dataset}\nsource=${SOURCE_URL}\n`),
      dataset,
      sourceUrl: SOURCE_URL,
      stateDate: "unknown",
    };
  }
}

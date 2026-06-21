import { unzipSync } from "fflate";

import { importTerytCsv } from "./teryt-csv.js";
import type { DatasetCode } from "../../domain/dataset.js";

export function importTerytZip(content: Uint8Array, expectedDataset?: DatasetCode) {
  const entries = unzipSync(content);
  const csvEntries = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(".csv"));

  if (csvEntries.length === 0) {
    throw new Error("TERYT ZIP does not contain a CSV file.");
  }

  const imports = csvEntries.flatMap(([, csvContent]) => {
    try {
      return [importTerytCsv(new TextDecoder().decode(csvContent))];
    } catch {
      return [];
    }
  });
  const matches = expectedDataset ? imports.filter((item) => item.dataset === expectedDataset) : imports;

  if (matches.length !== 1) {
    throw new Error(
      expectedDataset
        ? `TERYT ZIP must contain exactly one valid ${expectedDataset} CSV file.`
        : "TERYT ZIP must contain exactly one valid TERYT CSV file.",
    );
  }

  return matches[0];
}

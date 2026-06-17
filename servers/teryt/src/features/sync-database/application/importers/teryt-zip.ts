import { unzipSync } from "fflate";

import { importTerytCsv } from "./teryt-csv.js";

export function importTerytZip(content: Uint8Array) {
  const entries = unzipSync(content);
  const csvEntry = Object.entries(entries).find(([name]) => name.toLowerCase().endsWith(".csv"));

  if (!csvEntry) {
    throw new Error("TERYT ZIP does not contain a CSV file.");
  }

  const [, csvContent] = csvEntry;

  return importTerytCsv(new TextDecoder().decode(csvContent));
}

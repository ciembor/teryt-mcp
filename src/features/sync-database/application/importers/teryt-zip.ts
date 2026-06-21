import { unzipSync } from "fflate";

import { importTerytCsv } from "./teryt-csv.js";
import type { DatasetCode } from "../../domain/dataset.js";

export async function importTerytZip(content: Uint8Array, expectedDataset?: DatasetCode) {
  const entries = unzipSync(content);
  const csvEntries = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith(".csv"));

  if (csvEntries.length === 0) {
    throw new Error("TERYT ZIP does not contain a CSV file.");
  }

  const results = await Promise.all(
    csvEntries.map(async ([name, csvContent]) => {
      try {
        const imported = await importTerytCsv(csvContent);

        return { imported, name, status: "imported" as const };
      } catch (error) {
        return { error, name, status: "failed" as const };
      }
    }),
  );
  const imports = results.flatMap((result) => (result.status === "imported" ? [result.imported] : []));
  const matches = expectedDataset ? imports.filter((item) => item.dataset === expectedDataset) : imports;
  const match = matches[0];

  if (!match || matches.length !== 1) {
    const reason = expectedDataset
        ? `TERYT ZIP must contain exactly one valid ${expectedDataset} CSV file.`
        : "TERYT ZIP must contain exactly one valid TERYT CSV file.";
    const details = results
      .map((result) =>
        result.status === "imported"
          ? `${result.name}: detected ${result.imported.dataset}`
          : `${result.name}: ${formatError(result.error)}`,
      )
      .join("; ");

    throw new Error(`${reason} ${details}`);
  }

  return match;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

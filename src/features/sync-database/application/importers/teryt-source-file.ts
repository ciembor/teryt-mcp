import { importTerytCsv, type TerytImport } from "./teryt-csv.js";
import { importTerytZip } from "./teryt-zip.js";
import type { SourceFile } from "../ports/teryt-source.js";

export async function importTerytSourceFile(sourceFile: SourceFile): Promise<TerytImport> {
  if (isZip(sourceFile.content)) {
    return importTerytZip(sourceFile.content, sourceFile.dataset);
  }

  const imported = await importTerytCsv(sourceFile.content);

  if (imported.dataset !== sourceFile.dataset) {
    throw new Error(`Expected ${sourceFile.dataset} source file, received ${imported.dataset}.`);
  }

  return imported;
}

function isZip(content: Uint8Array): boolean {
  return content[0] === 0x50 && content[1] === 0x4b;
}

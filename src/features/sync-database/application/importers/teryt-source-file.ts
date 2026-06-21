import { TextDecoder } from "node:util";

import { importTerytCsv } from "./teryt-csv.js";
import { importTerytZip } from "./teryt-zip.js";
import type { SourceFile } from "../ports/teryt-source.js";

const decoder = new TextDecoder();

export function importTerytSourceFile(sourceFile: SourceFile) {
  if (isZip(sourceFile.content)) {
    return importTerytZip(sourceFile.content, sourceFile.dataset);
  }

  const imported = importTerytCsv(decoder.decode(sourceFile.content));

  if (imported.dataset !== sourceFile.dataset) {
    throw new Error(`Expected ${sourceFile.dataset} source file, received ${imported.dataset}.`);
  }

  return imported;
}

function isZip(content: Uint8Array): boolean {
  return content[0] === 0x50 && content[1] === 0x4b;
}

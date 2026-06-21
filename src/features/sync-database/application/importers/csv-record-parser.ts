import { Readable } from "node:stream";
import { TextDecoder } from "node:util";

import { parse } from "csv-parse";

const chunkSize = 64 * 1024;
const decoder = new TextDecoder();

export async function parseCsvRecords(content: string | Uint8Array): Promise<readonly (readonly string[])[]> {
  const parser = Readable.from(readChunks(content)).pipe(
    parse({
      bom: true,
      delimiter: detectDelimiter(content),
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: true,
    }),
  );
  const records: string[][] = [];

  for await (const record of parser) {
    records.push(record as string[]);
  }

  return records;
}

function* readChunks(content: string | Uint8Array): Generator<string | Uint8Array> {
  if (typeof content === "string") {
    yield content;
    return;
  }

  for (let offset = 0; offset < content.length; offset += chunkSize) {
    yield content.subarray(offset, offset + chunkSize);
  }
}

function detectDelimiter(content: string | Uint8Array): string {
  const prefix = typeof content === "string" ? content.slice(0, chunkSize) : decoder.decode(content.subarray(0, chunkSize));
  const headerEnd = prefix.search(/[\r\n]/);
  const header = prefix.slice(0, headerEnd < 0 ? undefined : headerEnd);

  return header.includes(";") ? ";" : ",";
}

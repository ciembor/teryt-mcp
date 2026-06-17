import { TextEncoder } from "node:util";

import type { DatabaseBuilder, BuiltDatabase } from "../application/ports/database-builder.js";
import type { SourceFile } from "../application/ports/teryt-source.js";

export class SqliteDatabaseBuilder implements DatabaseBuilder {
  async build(sourceFiles: readonly SourceFile[]): Promise<BuiltDatabase> {
    const content = sourceFiles.map((sourceFile) => `${sourceFile.dataset}:${sourceFile.content.byteLength}`).join("\n");

    return {
      content: new TextEncoder().encode(`TERYT placeholder database\n${content}\n`),
    };
  }
}

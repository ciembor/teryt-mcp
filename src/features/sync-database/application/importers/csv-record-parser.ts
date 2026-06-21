export function parseCsvRecords(content: string): readonly (readonly string[])[] {
  const headerEnd = content.search(/[\r\n]/);
  const header = content.slice(0, headerEnd < 0 ? undefined : headerEnd);
  const delimiter = header.includes(";") ? ";" : ",";
  return new CsvRecordParser(content, delimiter).parse();
}

class CsvRecordParser {
  private current = "";
  private quoted = false;
  private readonly records: string[][] = [];
  private values: string[] = [];

  constructor(
    private readonly content: string,
    private readonly delimiter: string,
  ) {}

  parse(): readonly (readonly string[])[] {
    for (let index = 0; index < this.content.length; index += 1) {
      index += this.consume(this.content[index] ?? "", this.content[index + 1]);
    }

    if (this.quoted) {
      throw new Error("TERYT CSV contains an unterminated quoted field.");
    }

    this.finishLastRecord();
    return this.records;
  }

  private consume(character: string, next: string | undefined): number {
    if (character === '"') {
      return this.consumeQuote(next);
    }

    if (character === this.delimiter && !this.quoted) {
      this.finishValue();
      return 0;
    }

    if (isRecordSeparator(character) && !this.quoted) {
      this.finishRecord();
      return character === "\r" && next === "\n" ? 1 : 0;
    }

    this.current += character;
    return 0;
  }

  private consumeQuote(next: string | undefined): number {
    if (this.quoted && next === '"') {
      this.current += '"';
      return 1;
    }

    this.quoted = !this.quoted;
    return 0;
  }

  private finishValue(): void {
    this.values.push(this.current);
    this.current = "";
  }

  private finishRecord(): void {
    this.finishValue();
    this.records.push(this.values);
    this.values = [];
  }

  private finishLastRecord(): void {
    if (this.current || this.values.length > 0) {
      this.finishRecord();
    }
  }
}

function isRecordSeparator(character: string): boolean {
  return character === "\n" || character === "\r";
}

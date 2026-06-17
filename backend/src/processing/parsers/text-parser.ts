import { Injectable, Logger } from '@nestjs/common';

export interface ParsedData {
  headers: string[];
  rows: string[][];
  detectedDelimiter: string;
}

@Injectable()
export class TextParser {
  private readonly logger = new Logger(TextParser.name);

  parse(text: string): ParsedData {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [], detectedDelimiter: '' };
    }

    const delimiter = this.detectDelimiter(lines[0]);
    this.logger.log(`Detected delimiter: "${delimiter}"`);

    const parsedLines = lines.map((line) =>
      this.parseLine(line, delimiter),
    );

    // First row is treated as headers
    const headers = parsedLines[0];
    const rows = parsedLines.slice(1);

    // Normalize row lengths to match header count
    const normalizedRows = rows.map((row) => {
      if (row.length < headers.length) {
        return [...row, ...new Array(headers.length - row.length).fill('')];
      }
      return row.slice(0, headers.length);
    });

    return {
      headers,
      rows: normalizedRows,
      detectedDelimiter: delimiter,
    };
  }

  private detectDelimiter(sampleLine: string): string {
    const delimiters = [
      { char: '\t', name: 'tab' },
      { char: ',', name: 'comma' },
      { char: '|', name: 'pipe' },
      { char: ';', name: 'semicolon' },
    ];

    let bestDelimiter = '\t';
    let maxCount = 0;

    for (const { char } of delimiters) {
      // Count occurrences outside of quoted strings
      let count = 0;
      let inQuotes = false;

      for (const c of sampleLine) {
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === char && !inQuotes) {
          count++;
        }
      }

      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = char;
      }
    }

    // If no delimiter found, treat each line as a single column
    if (maxCount === 0) {
      return '\n';
    }

    return bestDelimiter;
  }

  private parseLine(line: string, delimiter: string): string[] {
    if (delimiter === '\n') {
      return [line];
    }

    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  }
}

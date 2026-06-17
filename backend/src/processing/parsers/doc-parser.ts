import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { TextParser, ParsedData } from './text-parser';

@Injectable()
export class DocParser {
  private readonly logger = new Logger(DocParser.name);

  constructor(private readonly textParser: TextParser) {}

  async parse(buffer: Buffer): Promise<ParsedData> {
    this.logger.log('Parsing DOC/DOCX file...');

    // First try to extract HTML to detect tables
    const htmlResult = await mammoth.convertToHtml({ buffer });

    if (htmlResult.value.includes('<table')) {
      this.logger.log('Found table in document, extracting...');
      return this.parseHtmlTable(htmlResult.value);
    }

    // Fall back to raw text extraction
    const textResult = await mammoth.extractRawText({ buffer });
    this.logger.log(
      `Extracted ${textResult.value.length} characters of text`,
    );

    return this.textParser.parse(textResult.value);
  }

  private parseHtmlTable(html: string): ParsedData {
    const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];

    if (tables.length === 0) {
      return { headers: [], rows: [], detectedDelimiter: 'html-table' };
    }

    // Parse first table
    const table = tables[0]!;
    const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

    const allRows: string[][] = [];

    for (const rowHtml of rowMatches) {
      const cellMatches =
        rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      const cells = cellMatches.map((cell) =>
        cell
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim(),
      );
      if (cells.length > 0) {
        allRows.push(cells);
      }
    }

    if (allRows.length === 0) {
      return { headers: [], rows: [], detectedDelimiter: 'html-table' };
    }

    const headers = allRows[0];
    const rows = allRows.slice(1).map((row) => {
      if (row.length < headers.length) {
        return [...row, ...new Array(headers.length - row.length).fill('')];
      }
      return row.slice(0, headers.length);
    });

    return {
      headers,
      rows,
      detectedDelimiter: 'html-table',
    };
  }
}

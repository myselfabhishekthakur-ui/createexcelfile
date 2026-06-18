import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { TextParser, ParsedData } from './text-parser';

@Injectable()
export class PdfParser {
  private readonly logger = new Logger(PdfParser.name);

  constructor(private readonly textParser: TextParser) {}

  async parse(buffer: Buffer): Promise<ParsedData> {
    this.logger.log('Parsing PDF file...');
    try {
      const pdfParser = new PDFParse({ data: buffer });
      const parsed = await pdfParser.getText();
      this.logger.log(
        `Extracted ${parsed.text?.length || 0} characters of text from PDF`,
      );
      return this.textParser.parse(parsed.text || '');
    } catch (error) {
      this.logger.error('Failed to parse PDF file', error.stack);
      throw new Error(`Failed to read PDF file: ${error.message}`);
    }
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextParser } from './parsers/text-parser';
import { DocParser } from './parsers/doc-parser';
import { ExcelService } from '../excel/excel.service';
import { FilesService } from '../files/files.service';
import { ProcessingHistoryEntity } from '../database/entities/processing-history.entity';
import { ProcessResultDto } from './dto/process-result.dto';

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly textParser: TextParser,
    private readonly docParser: DocParser,
    private readonly excelService: ExcelService,
    private readonly filesService: FilesService,
    @InjectRepository(ProcessingHistoryEntity)
    private readonly historyRepo: Repository<ProcessingHistoryEntity>,
  ) {}

  async processText(text: string): Promise<ProcessResultDto> {
    const startTime = Date.now();
    const history = this.historyRepo.create({
      operationType: 'TEXT_TO_EXCEL',
      inputSummary: text.substring(0, 200),
      status: 'PROCESSING',
    });
    await this.historyRepo.save(history);

    try {
      const parsedData = this.textParser.parse(text);

      if (parsedData.headers.length === 0 && parsedData.rows.length === 0) {
        throw new Error(
          'Could not parse any structured data from the input text. Please ensure the data is formatted as CSV, TSV, or another delimited format.',
        );
      }

      const result =
        await this.excelService.generateFromParsedData(parsedData);

      const fileEntity = await this.filesService.saveGeneratedFile(
        result.filePath,
        result.fileName,
        result.fileSize,
      );

      history.resultFileId = fileEntity.id;
      history.status = 'COMPLETED';
      history.processingTimeMs = Date.now() - startTime;
      await this.historyRepo.save(history);

      return {
        fileId: fileEntity.id,
        fileName: result.fileName,
        fileSize: result.fileSize,
        sheetsCount: result.sheetsCount,
        rowsCount: result.rowsCount,
        columnsCount: result.columnsCount,
        message: `Successfully converted ${result.rowsCount} rows and ${result.columnsCount} columns`,
      };
    } catch (error) {
      history.status = 'FAILED';
      history.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      history.processingTimeMs = Date.now() - startTime;
      await this.historyRepo.save(history);
      throw error;
    }
  }

  async processDocument(
    file: Express.Multer.File,
  ): Promise<ProcessResultDto> {
    const startTime = Date.now();

    // Save the uploaded file
    const uploadedFile = await this.filesService.saveUploadedFile(file);

    const history = this.historyRepo.create({
      operationType: 'DOC_TO_EXCEL',
      sourceFileId: uploadedFile.id,
      inputSummary: `Document: ${file.originalname}`,
      status: 'PROCESSING',
    });
    await this.historyRepo.save(history);

    try {
      const parsedData = await this.docParser.parse(file.buffer);

      if (parsedData.headers.length === 0 && parsedData.rows.length === 0) {
        throw new Error(
          'Could not extract structured data from the document. Please ensure the document contains tables or delimited text.',
        );
      }

      const result = await this.excelService.generateFromParsedData(
        parsedData,
        file.originalname,
      );

      const fileEntity = await this.filesService.saveGeneratedFile(
        result.filePath,
        result.fileName,
        result.fileSize,
      );

      history.resultFileId = fileEntity.id;
      history.status = 'COMPLETED';
      history.processingTimeMs = Date.now() - startTime;
      await this.historyRepo.save(history);

      return {
        fileId: fileEntity.id,
        fileName: result.fileName,
        fileSize: result.fileSize,
        sheetsCount: result.sheetsCount,
        rowsCount: result.rowsCount,
        columnsCount: result.columnsCount,
        message: `Successfully extracted ${result.rowsCount} rows from "${file.originalname}"`,
      };
    } catch (error) {
      history.status = 'FAILED';
      history.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      history.processingTimeMs = Date.now() - startTime;
      await this.historyRepo.save(history);
      throw error;
    }
  }
}

import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcelService } from './excel.service';
import { FilesService } from '../files/files.service';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { ProcessingHistoryEntity } from '../database/entities/processing-history.entity';

@ApiTags('Excel')
@Controller('api/excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly filesService: FilesService,
    @InjectRepository(ProcessingHistoryEntity)
    private readonly historyRepo: Repository<ProcessingHistoryEntity>,
  ) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview an uploaded Excel file structure' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async previewExcel(
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.excelService.previewExcel(file.buffer);
  }

  @Post('modify')
  @ApiOperation({ summary: 'Modify an existing Excel file based on instructions' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        instructions: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async modifyExcel(
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('instructions') instructions: string,
  ) {
    if (!instructions || instructions.trim().length === 0) {
      throw new BadRequestException(
        'Instructions are required to modify the Excel file',
      );
    }

    const startTime = Date.now();

    // Save upload
    const uploadedFile = await this.filesService.saveUploadedFile(file);

    const history = this.historyRepo.create({
      operationType: 'MODIFY_EXCEL',
      sourceFileId: uploadedFile.id,
      inputSummary: `Modify: ${file.originalname}`,
      instructions,
      status: 'PROCESSING',
    });
    await this.historyRepo.save(history);

    try {
      const result = await this.excelService.modifyExcel(
        file.buffer,
        instructions,
        file.originalname,
      );

      const fileEntity = await this.filesService.saveGeneratedFile(
        result.filePath,
        result.fileName,
        result.fileSize,
        'MODIFIED',
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
        message: `Successfully modified "${file.originalname}"`,
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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { TextParser } from './parsers/text-parser';
import { DocParser } from './parsers/doc-parser';
import { PdfParser } from './parsers/pdf-parser';
import { ProcessingHistoryEntity } from '../database/entities/processing-history.entity';
import { ExcelModule } from '../excel/excel.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessingHistoryEntity]),
    ExcelModule,
    FilesModule,
  ],
  controllers: [ProcessingController],
  providers: [ProcessingService, TextParser, DocParser, PdfParser],
})
export class ProcessingModule {}


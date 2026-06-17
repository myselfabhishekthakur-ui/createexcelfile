import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { InstructionParser } from './instruction-parser';
import { ProcessingHistoryEntity } from '../database/entities/processing-history.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessingHistoryEntity]),
    FilesModule,
  ],
  controllers: [ExcelController],
  providers: [ExcelService, InstructionParser],
  exports: [ExcelService],
})
export class ExcelModule {}

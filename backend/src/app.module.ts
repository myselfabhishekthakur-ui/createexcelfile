import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import { ProcessingModule } from './processing/processing.module';
import { ExcelModule } from './excel/excel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    FilesModule,
    ProcessingModule,
    ExcelModule,
  ],
})
export class AppModule {}

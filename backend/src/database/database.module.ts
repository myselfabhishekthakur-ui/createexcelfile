import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileEntity } from './entities/file.entity';
import { ProcessingHistoryEntity } from './entities/processing-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>('database.type') as 'better-sqlite3',
        database: config.get<string>('database.database'),
        entities: [FileEntity, ProcessingHistoryEntity],
        synchronize: true, // Auto-create tables in dev
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([FileEntity, ProcessingHistoryEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}


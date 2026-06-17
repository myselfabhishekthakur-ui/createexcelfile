import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { FileEntity } from '../database/entities/file.entity';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsDir: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadsDir =
      this.configService.get<string>('storage.uploadsDir') ||
      './storage/uploads';
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async saveUploadedFile(
    file: Express.Multer.File,
  ): Promise<FileEntity> {
    const storedName = `${uuid()}_${file.originalname}`;
    const storagePath = path.join(this.uploadsDir, storedName);
    fs.writeFileSync(storagePath, file.buffer);

    const entity = this.fileRepo.create({
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      fileType: 'UPLOAD',
      storagePath,
    });

    const saved = await this.fileRepo.save(entity);
    this.logger.log(`Saved uploaded file: ${file.originalname} -> ${saved.id}`);
    return saved;
  }

  async saveGeneratedFile(
    filePath: string,
    fileName: string,
    fileSize: number,
    fileType: 'GENERATED' | 'MODIFIED' = 'GENERATED',
  ): Promise<FileEntity> {
    const entity = this.fileRepo.create({
      originalName: fileName,
      storedName: path.basename(filePath),
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: fileSize,
      fileType,
      storagePath: filePath,
    });

    const saved = await this.fileRepo.save(entity);
    this.logger.log(`Saved generated file: ${fileName} -> ${saved.id}`);
    return saved;
  }

  async getFile(id: string): Promise<FileEntity | null> {
    return this.fileRepo.findOne({ where: { id } });
  }

  async getFileBuffer(id: string): Promise<{ buffer: Buffer; entity: FileEntity } | null> {
    const entity = await this.getFile(id);
    if (!entity || !fs.existsSync(entity.storagePath)) {
      return null;
    }
    return {
      buffer: fs.readFileSync(entity.storagePath),
      entity,
    };
  }
}

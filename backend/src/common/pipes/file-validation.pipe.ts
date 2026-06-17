import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(options: FileValidationOptions = {}) {
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
  }

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${Math.round(this.maxSize / (1024 * 1024))}MB`,
      );
    }

    if (
      this.allowedMimeTypes.length > 0 &&
      !this.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Accepted types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    return file;
  }
}

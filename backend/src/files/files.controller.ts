import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('api/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file by ID' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.filesService.getFileBuffer(id);
    if (!result) {
      throw new NotFoundException('File not found');
    }

    const { buffer, entity } = result;

    res.set({
      'Content-Type': entity.mimeType,
      'Content-Disposition': `attachment; filename="${entity.originalName}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }

  @Get(':id/info')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  async getFileInfo(@Param('id') id: string) {
    const file = await this.filesService.getFile(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      fileType: file.fileType,
      createdAt: file.createdAt,
    };
  }
}

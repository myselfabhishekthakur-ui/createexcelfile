import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProcessingService } from './processing.service';
import { ProcessTextDto } from './dto/process-text.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('Processing')
@Controller('api/processing')
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) {}

  @Post('text')
  @ApiOperation({ summary: 'Process pasted text and generate Excel file' })
  async processText(@Body() dto: ProcessTextDto) {
    return this.processingService.processText(dto.text);
  }

  @Post('document')
  @ApiOperation({ summary: 'Process uploaded DOC/DOCX and generate Excel file' })
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
  async processDocument(
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.processingService.processDocument(file);
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class ProcessResultDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  sheetsCount: number;

  @ApiProperty()
  rowsCount: number;

  @ApiProperty()
  columnsCount: number;

  @ApiProperty()
  message: string;
}

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessTextDto {
  @ApiProperty({
    description: 'Raw text data to parse and convert to Excel',
    example: 'Name,Age,City\nJohn,30,NYC\nJane,25,LA',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  text: string;
}

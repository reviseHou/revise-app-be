import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsNumber()
  majorId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  credit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiProperty({ required: false, description: 'PDF | DOCX | PPTX' })
  @IsString()
  @IsOptional()
  mediaType?: string;

  @ApiProperty()
  @IsString()
  uploaderId: string;

  @ApiProperty()
  @IsNumber()
  subjectId: number;
}

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiProperty({ required: false, description: 'PDF | DOCX | PPTX' })
  @IsString()
  @IsOptional()
  mediaType?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  subjectId?: number;
}

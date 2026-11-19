import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DocumentCategory } from '../../enums';

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

  @ApiProperty({ required: false, enum: DocumentCategory })
  @IsEnum(DocumentCategory, { message: 'Loại tài liệu không hợp lệ' })
  @IsOptional()
  category?: DocumentCategory;

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

  @ApiProperty({ required: false, enum: DocumentCategory })
  @IsEnum(DocumentCategory, { message: 'Loại tài liệu không hợp lệ' })
  @IsOptional()
  category?: DocumentCategory;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  subjectId?: number;
}

import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DocumentCategory } from '../../enums';
import { Trim } from '../../validation';
import { MAX_YEAR, MIN_YEAR } from '../document-year';

export class CreateDocumentDto {
  @ApiProperty({ maxLength: 255 })
  @Trim()
  @IsString()
  @MaxLength(255, { message: 'Tên tài liệu tối đa 255 ký tự' })
  @IsNotEmpty({ message: 'Tên tài liệu không được để trống' })
  title: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000, { message: 'Mô tả tối đa 2000 ký tự' })
  description?: string;

  @ApiProperty({ required: false, minimum: MIN_YEAR, maximum: MAX_YEAR })
  @IsOptional()
  @IsInt({ message: 'Năm không hợp lệ' })
  @Min(MIN_YEAR, { message: 'Năm không hợp lệ' })
  @Max(MAX_YEAR, { message: 'Năm không hợp lệ' })
  year?: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500, { message: 'Đường dẫn tệp quá dài' })
  @IsNotEmpty({ message: 'Vui lòng chọn tệp tài liệu' })
  filePath: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Loại tệp không hợp lệ' })
  mediaType?: string;

  @ApiProperty({ enum: DocumentCategory })
  @IsEnum(DocumentCategory, { message: 'Loại tài liệu không hợp lệ' })
  category: DocumentCategory;

  @ApiProperty()
  @IsInt({ message: 'Vui lòng chọn môn học' })
  @Min(1, { message: 'Vui lòng chọn môn học' })
  subjectId: number;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

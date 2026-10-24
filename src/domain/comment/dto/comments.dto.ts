import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SourceKeyDto, Trim } from '../../validation';

export class UpdateCommentDto {
  @ApiProperty({ maxLength: 1000 })
  @Trim()
  @IsString()
  @MaxLength(1000, { message: 'Bình luận tối đa 1000 ký tự' })
  @IsNotEmpty({ message: 'Nội dung bình luận không được trống' })
  content: string;
}

export class CreateCommentDto extends SourceKeyDto {
  @ApiProperty({ maxLength: 1000 })
  @Trim()
  @IsString()
  @MaxLength(1000, { message: 'Bình luận tối đa 1000 ký tự' })
  @IsNotEmpty({ message: 'Nội dung bình luận không được trống' })
  content: string;

  @ApiProperty({ required: false, description: 'Bình luận cha khi trả lời' })
  @IsOptional()
  @IsInt({ message: 'parentId không hợp lệ' })
  @Min(1, { message: 'parentId không hợp lệ' })
  parentId?: number;

  @ApiProperty({ required: false, description: 'Người được nhắc tới' })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  replyToUserId?: string;
}

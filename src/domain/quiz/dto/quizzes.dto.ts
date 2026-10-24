import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuizStatus } from '../../enums';
import { Trim } from '../../validation';

class QuizAnswerContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 500 })
  @Trim()
  @IsString()
  @MaxLength(500, { message: 'Phương án tối đa 500 ký tự' })
  @IsNotEmpty({ message: 'Có phương án chưa nhập nội dung' })
  title: string;

  @ApiProperty({ description: 'Mỗi câu đúng 1 phương án true' })
  @IsBoolean()
  isCorrect: boolean;
}

class QuizQuestionContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 1000 })
  @Trim()
  @IsString()
  @MaxLength(1000, { message: 'Câu hỏi tối đa 1000 ký tự' })
  @IsNotEmpty({ message: 'Có câu hỏi chưa nhập nội dung' })
  title: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 2000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2000, { message: 'Giải thích tối đa 2000 ký tự' })
  explanation?: string | null;

  @ApiProperty({ type: [QuizAnswerContext], minItems: 2, maxItems: 6 })
  @IsArray()
  @ArrayMinSize(2, { message: 'Mỗi câu cần từ 2 đến 6 phương án' })
  @ArrayMaxSize(6, { message: 'Mỗi câu cần từ 2 đến 6 phương án' })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerContext)
  answers: QuizAnswerContext[];
}

export class QuizContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 200 })
  @Trim()
  @IsString()
  @MaxLength(200, { message: 'Tên bài kiểm tra tối đa 200 ký tự' })
  @IsNotEmpty({ message: 'Tên bài kiểm tra không được để trống' })
  name: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 500 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500, { message: 'Mô tả tối đa 500 ký tự' })
  description?: string | null;

  @ApiProperty()
  @IsInt({ message: 'Vui lòng chọn môn học' })
  @Min(1, { message: 'Vui lòng chọn môn học' })
  subjectId: number;

  @ApiProperty({ minimum: 1, maximum: 180 })
  @IsInt({ message: 'Thời gian làm bài phải từ 1 đến 180 phút' })
  @Min(1, { message: 'Thời gian làm bài phải từ 1 đến 180 phút' })
  @Max(180, { message: 'Thời gian làm bài phải từ 1 đến 180 phút' })
  estimateMinute: number;

  @ApiProperty({ type: [QuizQuestionContext], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1, { message: 'Bài kiểm tra cần ít nhất 1 câu hỏi' })
  @ArrayMaxSize(200, { message: 'Tối đa 200 câu hỏi' })
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionContext)
  questions: QuizQuestionContext[];

  @ApiProperty({ enum: QuizStatus, required: false, readOnly: true })
  status?: QuizStatus;

  @ApiProperty({ required: false, nullable: true, readOnly: true })
  rejectReason?: string | null;

  @ApiProperty({ required: false, readOnly: true })
  attemptCount?: number;
}

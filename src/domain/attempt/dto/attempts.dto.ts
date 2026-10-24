import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class SaveAnswerDto {
  @ApiProperty()
  @IsInt({ message: 'questionId không hợp lệ' })
  @Min(1, { message: 'questionId không hợp lệ' })
  questionId: number;

  @ApiProperty({ nullable: true, description: 'null để bỏ chọn' })
  @ValidateIf((answer: SaveAnswerDto) => answer.answerId !== null)
  @IsInt({ message: 'answerId không hợp lệ' })
  @Min(1, { message: 'answerId không hợp lệ' })
  answerId: number | null;
}

export class SaveAnswersDto {
  @ApiProperty({ type: [SaveAnswerDto] })
  @IsArray({ message: 'answers phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => SaveAnswerDto)
  answers: SaveAnswerDto[];
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [SaveAnswerDto], required: false })
  @IsOptional()
  @IsArray({ message: 'answers phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => SaveAnswerDto)
  answers?: SaveAnswerDto[];
}

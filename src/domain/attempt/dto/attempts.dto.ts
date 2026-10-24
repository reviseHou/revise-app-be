import { ApiProperty } from '@nestjs/swagger';

export class SaveAnswerDto {
  @ApiProperty()
  questionId: number;

  @ApiProperty({ nullable: true, description: 'null để bỏ chọn' })
  answerId: number | null;
}

export class SaveAnswersDto {
  @ApiProperty({ type: [SaveAnswerDto] })
  answers: SaveAnswerDto[];
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [SaveAnswerDto], required: false })
  answers?: SaveAnswerDto[];
}

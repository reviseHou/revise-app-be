import { ApiProperty } from '@nestjs/swagger';
import { QuizStatus } from '../../enums';

export class QuizAnswerContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 500 })
  title: string;

  @ApiProperty({ description: 'Mỗi câu đúng 1 phương án true' })
  isCorrect: boolean;
}

export class QuizQuestionContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 1000 })
  title: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 2000 })
  explanation?: string | null;

  @ApiProperty({ type: [QuizAnswerContext], minItems: 2, maxItems: 6 })
  answers: QuizAnswerContext[];
}

export class QuizContext {
  @ApiProperty({ required: false, description: 'Chỉ có khi lấy về để sửa' })
  id?: number;

  @ApiProperty({ maxLength: 200 })
  title: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 500 })
  description?: string | null;

  @ApiProperty()
  subjectId: number;

  @ApiProperty({ minimum: 1, maximum: 180 })
  durationMinutes: number;

  @ApiProperty({ type: [QuizQuestionContext], minItems: 1 })
  questions: QuizQuestionContext[];

  @ApiProperty({ enum: QuizStatus, required: false, readOnly: true })
  status?: QuizStatus;

  @ApiProperty({ required: false, nullable: true, readOnly: true })
  rejectReason?: string | null;

  @ApiProperty({ required: false, readOnly: true })
  attemptCount?: number;
}

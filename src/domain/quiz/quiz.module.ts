import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/domain/auth/auth.module';
import { AttemptsController } from '../attempt/attempts.controller';
import { AttemptsService } from '../attempt/attempts.service';
import { Attempts } from '../attempt/entity/attempt.entity';
import { UserAnswers } from '../attempt/entity/user-answer.entity';
import { Answers } from './entity/answer.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import { Subjects } from '../subject/entity/subject.entity';
import { QuizAuthoringService } from './quiz-authoring.service';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quizzes,
      Questions,
      Answers,
      Attempts,
      UserAnswers,
      Subjects,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [QuizzesController, AttemptsController],
  providers: [QuizzesService, AttemptsService, QuizAuthoringService],
  exports: [QuizzesService],
})
export class QuizModule {}

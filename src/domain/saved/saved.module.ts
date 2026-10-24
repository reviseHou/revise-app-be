import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/domain/auth/auth.module';
import { Documents } from '../document/entity/document.entity';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { QuizModule } from '../quiz/quiz.module';
import { SavedItems } from './entity/saved-item.entity';
import { SavedController } from './saved.controller';
import { SavedService } from './saved.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedItems, Documents, Quizzes]),
    QuizModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [SavedController],
  providers: [SavedService],
})
export class SavedModule {}

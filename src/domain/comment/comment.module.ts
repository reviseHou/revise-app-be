import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/domain/auth/auth.module';
import { Documents } from '../document/entity/document.entity';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { Users } from '../user/entity/user.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comments } from './entity/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comments, Documents, Quizzes, Users]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentModule {}

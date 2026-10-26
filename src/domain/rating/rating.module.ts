import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/domain/auth/auth.module';
import { Documents } from '../document/entity/document.entity';
import { Quizzes } from '../quiz/entity/quiz.entity';
import { Ratings } from './entity/rating.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ratings, Documents, Quizzes]),
    forwardRef(() => AuthModule),
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingModule {}

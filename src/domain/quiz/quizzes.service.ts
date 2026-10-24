import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveStatus, AttemptStatus, QuizStatus } from '../enums';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import {
  MyQuizView,
  QuizCounts,
  QuizSummaryView,
  toQuizSummary,
} from './quiz.view';

type RawCounts = { questionCount: string; attemptCount: string };

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quizzes)
    private readonly quizzesRepository: Repository<Quizzes>,
    @InjectRepository(Questions)
    private readonly questionsRepository: Repository<Questions>,
  ) {}

  private withCounts(status: QuizStatus | null = QuizStatus.ACTIVE) {
    const query = this.quizzesRepository
      .createQueryBuilder('quiz')
      .innerJoinAndSelect('quiz.subject', 'subject')
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(question.id)')
            .from(Questions, 'question')
            .where('question."quizId" = quiz.id')
            .andWhere('question.status = :questionStatus', {
              questionStatus: ActiveStatus.ACTIVE,
            }),
        'questionCount',
      )
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(attempt.id)')
            .from('attempts', 'attempt')
            .where('attempt."quizId" = quiz.id')
            .andWhere('attempt.status = :attemptStatus', {
              attemptStatus: AttemptStatus.SUBMITTED,
            }),
        'attemptCount',
      );
    if (status) query.where('quiz.status = :status', { status });
    return query;
  }

  private static countsOf(raw: RawCounts): QuizCounts {
    return {
      questionCount: Number(raw.questionCount),
      attemptCount: Number(raw.attemptCount),
    };
  }

  async list(subjectId?: number): Promise<QuizSummaryView[]> {
    const query = this.withCounts().orderBy('quiz.createdAt', 'DESC');
    if (subjectId) query.andWhere('subject.id = :subjectId', { subjectId });
    const { entities, raw } = await query.getRawAndEntities<RawCounts>();
    return entities
      .map((quiz, index) =>
        toQuizSummary(quiz, QuizzesService.countsOf(raw[index])),
      )
      .filter((quiz) => quiz.questionCount > 0);
  }

  async listByIds(ids: number[]): Promise<QuizSummaryView[]> {
    if (ids.length === 0) return [];
    const { entities, raw } = await this.withCounts()
      .andWhere('quiz.id IN (:...ids)', { ids })
      .getRawAndEntities<RawCounts>();
    return entities.map((quiz, index) =>
      toQuizSummary(quiz, QuizzesService.countsOf(raw[index])),
    );
  }

  async mine(userId: number): Promise<MyQuizView[]> {
    const { entities, raw } = await this.withCounts(null)
      .andWhere('quiz."createdById" = :userId', { userId })
      .andWhere('quiz.status != :hidden', { hidden: QuizStatus.INACTIVE })
      .orderBy('quiz.updateAt', 'DESC')
      .getRawAndEntities<RawCounts>();
    return entities.map((quiz, index) => ({
      ...toQuizSummary(quiz, QuizzesService.countsOf(raw[index])),
      status: quiz.status,
      rejectReason: quiz.rejectReason,
      updateAt: quiz.updateAt,
    }));
  }

  findQuestions(quizId: number): Promise<Questions[]> {
    return this.questionsRepository.find({
      where: { quiz: { id: quizId }, status: ActiveStatus.ACTIVE },
      relations: ['answers'],
    });
  }

  async summary(id: number): Promise<QuizSummaryView> {
    const { entities, raw } = await this.withCounts()
      .andWhere('quiz.id = :id', { id })
      .getRawAndEntities<RawCounts>();
    if (!entities[0]) throw new NotFoundException(`Quiz ${id} not found`);
    return toQuizSummary(entities[0], QuizzesService.countsOf(raw[0]));
  }
}

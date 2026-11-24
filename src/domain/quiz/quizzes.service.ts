import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempts } from '../attempt/entity/attempt.entity';
import { ActiveStatus, AttemptStatus, QuizStatus } from '../enums';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import { MyQuizView, QuizSummaryView, toQuizSummary } from './quiz.view';

type RawCounts = { attemptCount: string };

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
            .select('COUNT(attempt.id)')
            .from(Attempts, 'attempt')
            .where('attempt.quiz_id = quiz.id')
            .andWhere('attempt.status = :attemptStatus', {
              attemptStatus: AttemptStatus.SUBMITTED,
            }),
        'attemptCount',
      );
    if (status) query.where('quiz.status = :status', { status });
    return query;
  }

  async list(subjectId?: number): Promise<QuizSummaryView[]> {
    const query = this.withCounts()
      .andWhere('quiz.totalQuestion > 0')
      .orderBy('quiz.dateCreated', 'DESC');
    if (subjectId) query.andWhere('subject.id = :subjectId', { subjectId });
    const { entities, raw } = await query.getRawAndEntities<RawCounts>();
    return entities.map((quiz, index) =>
      toQuizSummary(quiz, Number(raw[index].attemptCount)),
    );
  }

  async listByIds(ids: number[]): Promise<QuizSummaryView[]> {
    if (ids.length === 0) return [];
    const { entities, raw } = await this.withCounts()
      .andWhere('quiz.id IN (:...ids)', { ids })
      .getRawAndEntities<RawCounts>();
    return entities.map((quiz, index) =>
      toQuizSummary(quiz, Number(raw[index].attemptCount)),
    );
  }

  async mine(userId: string): Promise<MyQuizView[]> {
    const { entities, raw } = await this.withCounts(null)
      .andWhere('quiz.created_by = :userId', { userId })
      .andWhere('quiz.status NOT IN (:...hidden)', {
        hidden: [QuizStatus.INACTIVE, QuizStatus.DELETED],
      })
      .orderBy('quiz.dateModified', 'DESC')
      .getRawAndEntities<RawCounts>();
    return entities.map((quiz, index) => ({
      ...toQuizSummary(quiz, Number(raw[index].attemptCount)),
      status: quiz.status,
      rejectReason: quiz.rejectReason,
      dateModified: quiz.dateModified,
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
    return toQuizSummary(entities[0], Number(raw[0].attemptCount));
  }
}

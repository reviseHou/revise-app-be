import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AttemptStatus } from '../enums';
import { Questions } from '../quiz/entity/question.entity';
import { QuizSummaryView } from '../quiz/quiz.view';
import { QuizzesService } from '../quiz/quizzes.service';
import { Users } from '../user/entity/user.entity';
import {
  AttemptView,
  expiresAtOf,
  toAttemptHistory,
  toAttemptView,
} from './attempt.view';
import {
  SaveAnswerDto,
  SaveAnswersDto,
  SubmitAttemptDto,
} from './dto/attempts.dto';
import { Attempts } from './entity/attempt.entity';
import { UserAnswers } from './entity/user-answer.entity';

const SUBMIT_GRACE_MS = 30_000;

function assertUniqueQuestions(answers: SaveAnswerDto[]) {
  const ids = new Set(answers.map((answer) => answer.questionId));
  if (ids.size !== answers.length) {
    throw new BadRequestException('Mỗi câu hỏi chỉ được gửi một lần');
  }
  return answers;
}

function scoreOf(totalCorrect: number, totalQuestion: number) {
  if (totalQuestion === 0) return 0;
  return Math.round((totalCorrect / totalQuestion) * 1000) / 100;
}

@Injectable()
export class AttemptsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly quizzesService: QuizzesService,
    @InjectRepository(Attempts)
    private readonly attemptsRepository: Repository<Attempts>,
    @InjectRepository(UserAnswers)
    private readonly userAnswersRepository: Repository<UserAnswers>,
  ) {}

  async start(user: Users, quizId: number): Promise<AttemptView> {
    const quiz = await this.quizzesService.summary(quizId);
    if (quiz.totalQuestion === 0) {
      throw new BadRequestException('Bài kiểm tra chưa có câu hỏi');
    }

    const attempt = await this.attemptsRepository.save(
      this.attemptsRepository.create({
        quiz: { id: quizId },
        user: { id: user.id },
        status: AttemptStatus.IN_PROGRESS,
        dateStarted: new Date(),
      }),
    );
    return this.view(attempt, quiz);
  }

  async get(user: Users, attemptId: number): Promise<AttemptView> {
    const attempt = await this.findOwned(user, attemptId);
    const quiz = await this.quizzesService.summary(attempt.quiz.id);
    return this.view(attempt, quiz);
  }

  async saveAnswers(user: Users, attemptId: number, body: SaveAnswersDto) {
    const inputs = assertUniqueQuestions(body.answers);
    const attempt = await this.findOwned(user, attemptId);
    const quiz = await this.quizzesService.summary(attempt.quiz.id);
    this.assertWritable(attempt, quiz);

    const questions = await this.quizzesService.findQuestions(quiz.id);
    await this.dataSource.transaction((manager) =>
      this.upsertAnswers(manager, attempt, questions, inputs),
    );
    return { saved: inputs.length };
  }

  async submit(
    user: Users,
    attemptId: number,
    body: SubmitAttemptDto,
  ): Promise<AttemptView> {
    const answers = assertUniqueQuestions(body.answers ?? []);

    const attempt = await this.findOwned(user, attemptId);
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new ConflictException('Lượt làm bài đã được nộp');
    }

    // No time check on submit: the client tracks the deadline (startedAt + now) and auto-submits when it ends.
    await this.grade(attempt, answers);
    return this.get(user, attemptId);
  }

  async history(user: Users, quizId: number) {
    const attempts = await this.attemptsRepository.find({
      where: { quiz: { id: quizId }, user: { id: user.id } },
      order: { dateStarted: 'DESC' },
    });
    return attempts.map(toAttemptHistory);
  }

  private async grade(attempt: Attempts, answers: SaveAnswerDto[]) {
    const questions = await this.quizzesService.findQuestions(attempt.quiz.id);

    await this.dataSource.transaction(async (manager) => {
      await this.upsertAnswers(manager, attempt, questions, answers);

      const saved = await manager.find(UserAnswers, {
        where: { attempt: { id: attempt.id } },
        relations: ['question', 'answer'],
      });
      const byQuestion = new Map(saved.map((row) => [row.question.id, row]));

      let totalCorrect = 0;
      for (const question of questions) {
        const row =
          byQuestion.get(question.id) ??
          manager.create(UserAnswers, {
            attempt: { id: attempt.id },
            question: { id: question.id },
            answer: null,
          });
        const correctId = question.answers.find(
          (answer) => answer.isCorrect,
        )?.id;
        row.isCorrect = !!row.answer && row.answer.id === correctId;
        if (row.isCorrect) totalCorrect += 1;
        await manager.save(UserAnswers, row);
      }

      await manager.update(Attempts, attempt.id, {
        status: AttemptStatus.SUBMITTED,
        dateSubmitted: new Date(),
        totalCorrect,
        score: scoreOf(totalCorrect, questions.length),
      });
    });
  }

  private async upsertAnswers(
    manager: EntityManager,
    attempt: Attempts,
    questions: Questions[],
    inputs: SaveAnswerDto[],
  ) {
    for (const input of inputs) {
      const question = questions.find((item) => item.id === input.questionId);
      if (!question) {
        throw new BadRequestException(
          `Câu hỏi ${input.questionId} không thuộc bài kiểm tra`,
        );
      }
      if (
        input.answerId !== null &&
        !question.answers.some((answer) => answer.id === input.answerId)
      ) {
        throw new BadRequestException(
          `Đáp án ${input.answerId} không thuộc câu hỏi ${input.questionId}`,
        );
      }

      const existing = await manager.findOne(UserAnswers, {
        where: { attempt: { id: attempt.id }, question: { id: question.id } },
      });
      const row =
        existing ??
        manager.create(UserAnswers, {
          attempt: { id: attempt.id },
          question: { id: question.id },
        });
      row.answer =
        input.answerId === null
          ? null
          : ({ id: input.answerId } as UserAnswers['answer']);
      row.dateAnswered = new Date();
      await manager.save(UserAnswers, row);
    }
  }

  private async view(attempt: Attempts, quiz: QuizSummaryView) {
    const [questions, userAnswers] = await Promise.all([
      this.quizzesService.findQuestions(quiz.id),
      this.userAnswersRepository.find({
        where: { attempt: { id: attempt.id } },
        relations: ['question', 'answer'],
      }),
    ]);
    return toAttemptView(attempt, quiz, questions, userAnswers);
  }

  private async findOwned(user: Users, attemptId: number) {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: String(attemptId) },
      relations: ['quiz', 'user'],
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.user.id !== user.id) {
      throw new ForbiddenException('Không phải lượt làm bài của bạn');
    }
    return attempt;
  }

  private isExpired(attempt: Attempts, quiz: QuizSummaryView) {
    return (
      Date.now() >
      expiresAtOf(attempt, quiz.estimateMinute).getTime() + SUBMIT_GRACE_MS
    );
  }

  private assertWritable(attempt: Attempts, quiz: QuizSummaryView) {
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new ConflictException('Lượt làm bài đã được nộp');
    }
    if (this.isExpired(attempt, quiz)) {
      throw new ConflictException('Đã hết thời gian làm bài');
    }
  }
}

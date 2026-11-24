import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Comments } from '../comment/entity/comment.entity';
import { ActiveStatus, QuizStatus, SourceType } from '../enums';
import { Ratings } from '../rating/entity/rating.entity';
import { SavedItems } from '../saved/entity/saved-item.entity';
import { Subjects } from '../subject/entity/subject.entity';
import { Users } from '../user/entity/user.entity';
import { Answers } from './entity/answer.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import { QuizContext } from './dto/quizzes.dto';
import { byPosition } from './quiz.view';

function assertOneCorrectAnswer(body: QuizContext) {
  body.questions.forEach((question, index) => {
    if (question.answers.filter((answer) => answer.isCorrect).length !== 1) {
      throw new BadRequestException(
        `Câu ${index + 1} phải có đúng 1 đáp án đúng`,
      );
    }
  });
  return body;
}

@Injectable()
export class QuizAuthoringService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Quizzes)
    private readonly quizzesRepository: Repository<Quizzes>,
    @InjectRepository(Subjects)
    private readonly subjectsRepository: Repository<Subjects>,
  ) {}

  async create(user: Users, body: QuizContext) {
    const input = assertOneCorrectAnswer(body);
    await this.assertSubject(input.subjectId);
    const id = await this.dataSource.transaction(async (manager) => {
      const quiz = await manager.save(
        manager.create(Quizzes, {
          name: input.name,
          description: input.description || null,
          estimateMinute: input.estimateMinute,
          totalQuestion: input.questions.length,
          status: QuizStatus.PENDING,
          subject: { id: input.subjectId },
          createdBy: { id: user.id },
        }),
      );
      await this.saveQuestions(manager, quiz.id, input);
      return quiz.id;
    });
    return { id, status: QuizStatus.PENDING };
  }

  async getEditable(user: Users, id: number): Promise<QuizContext> {
    const quiz = await this.findOwned(user, id);
    const questions = await this.dataSource.getRepository(Questions).find({
      where: { quiz: { id }, status: ActiveStatus.ACTIVE },
      relations: ['answers'],
    });
    return {
      id: quiz.id,
      name: quiz.name,
      description: quiz.description,
      estimateMinute: quiz.estimateMinute,
      status: quiz.status,
      rejectReason: quiz.rejectReason,
      subjectId: quiz.subject.id,
      attemptCount: await this.countAttempts(id),
      questions: questions.sort(byPosition).map((question) => ({
        id: question.id,
        title: question.title,
        explanation: question.explanation,
        answers: [...question.answers].sort(byPosition).map((answer) => ({
          id: answer.id,
          title: answer.title,
          isCorrect: answer.isCorrect,
        })),
      })),
    };
  }

  async update(user: Users, id: number, body: QuizContext) {
    const quiz = await this.findOwned(user, id);
    // Approved quizzes can only be deleted; editing is allowed while PENDING or REJECTED.
    if (![QuizStatus.PENDING, QuizStatus.REJECTED].includes(quiz.status)) {
      throw new ConflictException(
        'Bài kiểm tra đã được duyệt nên không thể chỉnh sửa. Bạn có thể xóa và tạo bài mới.',
      );
    }
    const input = assertOneCorrectAnswer(body);
    await this.assertSubject(input.subjectId);
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(Questions)
        .where('quiz_id = :quizId', { quizId: quiz.id })
        .execute();
      await manager.update(Quizzes, quiz.id, {
        name: input.name,
        description: input.description || null,
        estimateMinute: input.estimateMinute,
        totalQuestion: input.questions.length,
        subject: { id: input.subjectId },
        status: QuizStatus.PENDING,
        rejectReason: null,
        reviewedBy: null,
        dateReviewed: null,
      });
      await this.saveQuestions(manager, quiz.id, input);
    });
    return { id: quiz.id, status: QuizStatus.PENDING };
  }

  async remove(user: Users, id: number) {
    const quiz = await this.findOwned(user, id);
    const source = { sourceType: SourceType.QUIZ, sourceId: String(quiz.id) };
    await this.dataSource.transaction(async (manager) => {
      // These tables have no foreign key to quiz; questions, answers and attempts cascade.
      await manager.delete(Comments, source);
      await manager.delete(Ratings, source);
      await manager.delete(SavedItems, source);
      await manager.delete(Quizzes, quiz.id);
    });
    return { id: quiz.id };
  }

  private async saveQuestions(
    manager: EntityManager,
    quizId: number,
    input: QuizContext,
  ) {
    for (const [index, item] of input.questions.entries()) {
      const question = await manager.save(
        manager.create(Questions, {
          quiz: { id: quizId },
          title: item.title,
          explanation: item.explanation || null,
          position: index + 1,
        }),
      );
      await manager.save(
        item.answers.map((answer, answerIndex) =>
          manager.create(Answers, {
            question: { id: question.id },
            title: answer.title,
            isCorrect: answer.isCorrect,
            position: answerIndex + 1,
          }),
        ),
      );
    }
  }

  private countAttempts(quizId: number) {
    return this.dataSource
      .createQueryBuilder()
      .from('attempt', 'attempt')
      .where('attempt.quiz_id = :quizId', { quizId })
      .getCount();
  }

  private async assertSubject(subjectId: number) {
    const exists = await this.subjectsRepository.existsBy({
      id: subjectId,
      status: ActiveStatus.ACTIVE,
    });
    if (!exists) throw new BadRequestException('Môn học không tồn tại');
  }

  private async findOwned(user: Users, id: number) {
    const quiz = await this.quizzesRepository.findOne({
      where: { id },
      relations: ['subject', 'createdBy'],
    });
    if (!quiz || quiz.status === QuizStatus.INACTIVE) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }
    if (quiz.createdBy?.id !== user.id) {
      throw new ForbiddenException('Chỉ người tạo mới được sửa bài kiểm tra');
    }
    return quiz;
  }
}

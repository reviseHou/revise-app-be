import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ActiveStatus, QuizStatus } from '../enums';
import { Subjects } from '../subject/entity/subject.entity';
import { Users } from '../user/entity/user.entity';
import { Answers } from './entity/answer.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import { QuizContext } from './dto/quizzes.dto';
import { byPosition } from './quiz.view';

const LIMITS = {
  title: 200,
  description: 500,
  minDuration: 1,
  maxDuration: 180,
  maxQuestions: 200,
  question: 1000,
  explanation: 2000,
  answer: 500,
  minAnswers: 2,
  maxAnswers: 6,
};

interface QuizInput {
  title: string;
  description: string | null;
  subjectId: number;
  durationMinutes: number;
  questions: {
    title: string;
    explanation: string | null;
    answers: { title: string; isCorrect: boolean }[];
  }[];
}

const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

function requireText(value: unknown, field: string, max: number) {
  const result = text(value);
  if (!result) throw new BadRequestException(`${field} không được để trống`);
  if (result.length > max) {
    throw new BadRequestException(`${field} tối đa ${max} ký tự`);
  }
  return result;
}

function optionalText(value: unknown, field: string, max: number) {
  const result = text(value);
  if (result.length > max) {
    throw new BadRequestException(`${field} tối đa ${max} ký tự`);
  }
  return result || null;
}

function parseQuiz(body: unknown): QuizInput {
  const raw = (body ?? {}) as Record<string, unknown>;
  const subjectId = Number(raw.subjectId);
  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    throw new BadRequestException('Vui lòng chọn môn học');
  }
  const durationMinutes = Number(raw.durationMinutes);
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < LIMITS.minDuration ||
    durationMinutes > LIMITS.maxDuration
  ) {
    throw new BadRequestException(
      `Thời gian làm bài phải từ ${LIMITS.minDuration} đến ${LIMITS.maxDuration} phút`,
    );
  }
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    throw new BadRequestException('Bài kiểm tra cần ít nhất 1 câu hỏi');
  }
  if (raw.questions.length > LIMITS.maxQuestions) {
    throw new BadRequestException(`Tối đa ${LIMITS.maxQuestions} câu hỏi`);
  }

  const questions = raw.questions.map((item: unknown, index: number) => {
    const label = `Câu ${index + 1}`;
    const question = (item ?? {}) as Record<string, unknown>;
    const answers = Array.isArray(question.answers) ? question.answers : [];
    if (
      answers.length < LIMITS.minAnswers ||
      answers.length > LIMITS.maxAnswers
    ) {
      throw new BadRequestException(
        `${label} cần từ ${LIMITS.minAnswers} đến ${LIMITS.maxAnswers} phương án`,
      );
    }
    const parsedAnswers = answers.map(
      (answer: unknown, answerIndex: number) => {
        const value = (answer ?? {}) as Record<string, unknown>;
        return {
          title: requireText(
            value.title,
            `${label}, phương án ${answerIndex + 1}`,
            LIMITS.answer,
          ),
          isCorrect: value.isCorrect === true,
        };
      },
    );
    if (parsedAnswers.filter((answer) => answer.isCorrect).length !== 1) {
      throw new BadRequestException(`${label} phải có đúng 1 đáp án đúng`);
    }
    return {
      title: requireText(question.title, `Nội dung ${label}`, LIMITS.question),
      explanation: optionalText(
        question.explanation,
        `Giải thích ${label}`,
        LIMITS.explanation,
      ),
      answers: parsedAnswers,
    };
  });

  return {
    title: requireText(raw.title, 'Tên bài kiểm tra', LIMITS.title),
    description: optionalText(raw.description, 'Mô tả', LIMITS.description),
    subjectId,
    durationMinutes,
    questions,
  };
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

  async create(user: Users, body: unknown) {
    const input = parseQuiz(body);
    await this.assertSubject(input.subjectId);
    const id = await this.dataSource.transaction(async (manager) => {
      const quiz = await manager.save(
        manager.create(Quizzes, {
          title: input.title,
          description: input.description,
          durationMinutes: input.durationMinutes,
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
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
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

  async update(user: Users, id: number, body: unknown) {
    const quiz = await this.findOwned(user, id);
    if ((await this.countAttempts(id)) > 0) {
      throw new ConflictException(
        'Bài kiểm tra đã có người làm nên không sửa được. Hãy tạo bài mới.',
      );
    }
    const input = parseQuiz(body);
    await this.assertSubject(input.subjectId);
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(Questions)
        .where('"quizId" = :quizId', { quizId: quiz.id })
        .execute();
      await manager.update(Quizzes, quiz.id, {
        title: input.title,
        description: input.description,
        durationMinutes: input.durationMinutes,
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
    await this.quizzesRepository.update(quiz.id, {
      status: QuizStatus.INACTIVE,
    });
    return { id: quiz.id };
  }

  private async saveQuestions(
    manager: EntityManager,
    quizId: number,
    input: QuizInput,
  ) {
    for (const [index, item] of input.questions.entries()) {
      const question = await manager.save(
        manager.create(Questions, {
          quiz: { id: quizId },
          title: item.title,
          explanation: item.explanation,
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
      .from('attempts', 'attempt')
      .where('attempt."quizId" = :quizId', { quizId })
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

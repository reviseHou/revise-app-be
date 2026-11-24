import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ActiveStatus, QuizStatus } from '../enums';
import {
  FacultyScope,
  applyFacultyScope,
  assertInFacultyScope,
  facultyScopeOf,
} from '../faculty-scope';
import { RejectDocumentForm, listOf } from '../forms';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Users } from '../user/entity/user.entity';
import { Questions } from './entity/question.entity';
import { Quizzes } from './entity/quiz.entity';
import { QUIZ_REVIEW_CRITERIA } from './quiz.criteria';
import { byPosition } from './quiz.view';

@Injectable()
export class QuizBean {
  constructor(
    @InjectRepository(Quizzes)
    private readonly quizRepository: Repository<Quizzes>,
    @InjectRepository(Questions)
    private readonly questionRepository: Repository<Questions>,
  ) {}

  async countByStatus(scope: FacultyScope) {
    const query = this.quizRepository.createQueryBuilder('quiz');
    if (scope !== null) {
      query
        .innerJoin('quiz.subject', 'scopeSubject')
        .innerJoin('scopeSubject.major', 'scopeMajor');
      applyFacultyScope(query, scope, '"scopeMajor"."faculty_id"');
    }
    const rows = await query
      .select('quiz.status', 'status')
      .addSelect('COUNT(quiz.id)', 'count')
      .andWhere('quiz.status != :deleted', { deleted: QuizStatus.DELETED })
      .groupBy('quiz.status')
      .getRawMany<{ status: QuizStatus; count: string }>();
    const countByStatus = {} as Record<QuizStatus, number>;
    for (const status of Object.values(QuizStatus)) countByStatus[status] = 0;
    for (const row of rows) countByStatus[row.status] = Number(row.count);
    return countByStatus;
  }

  async search(
    keyword: string,
    status: QuizStatus | undefined,
    page: number,
    scope: FacultyScope,
  ) {
    const query = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.createdBy', 'createdBy')
      .leftJoinAndSelect('quiz.subject', 'subject')
      .leftJoinAndSelect('subject.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .where('quiz.status != :deleted', { deleted: QuizStatus.DELETED })
      .orderBy('quiz.dateCreated', 'DESC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    applyFacultyScope(query, scope, 'faculty.id');
    if (status) query.andWhere('quiz.status = :status', { status });
    if (keyword) {
      query.andWhere('quiz.name ILIKE :like', { like: likeOf(keyword) });
    }
    const [quizzes, total] = await query.getManyAndCount();
    return { quizzes, total };
  }

  async findById(id: number, scope: FacultyScope) {
    const quiz = await this.quizRepository.findOne({
      where: { id, status: Not(QuizStatus.DELETED) },
      relations: [
        'createdBy',
        'reviewedBy',
        'subject',
        'subject.major',
        'subject.major.faculty',
      ],
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra');
    assertInFacultyScope(scope, quiz.subject?.major?.faculty?.id);
    const questions = await this.questionRepository.find({
      where: { quiz: { id }, status: ActiveStatus.ACTIVE },
      relations: ['answers'],
    });
    return {
      quiz,
      questions: questions.sort(byPosition).map((question, index) => ({
        number: index + 1,
        title: question.title,
        explanation: question.explanation,
        answers: [...question.answers].sort(byPosition).map((answer, i) => ({
          letter: String.fromCharCode(65 + i),
          title: answer.title,
          isCorrect: answer.isCorrect,
        })),
      })),
    };
  }

  approve(id: number, reviewer: Users) {
    return this.review(id, reviewer, QuizStatus.PENDING, {
      status: QuizStatus.ACTIVE,
      rejectReason: null,
    });
  }

  reject(id: number, reviewer: Users, form: RejectDocumentForm) {
    return this.review(id, reviewer, QuizStatus.PENDING, {
      status: QuizStatus.REJECTED,
      rejectReason: this.buildRejectReason(form),
    });
  }

  hide(id: number, reviewer: Users) {
    return this.review(id, reviewer, QuizStatus.ACTIVE, {
      status: QuizStatus.INACTIVE,
      rejectReason: null,
    });
  }

  show(id: number, reviewer: Users) {
    return this.review(id, reviewer, QuizStatus.INACTIVE, {
      status: QuizStatus.ACTIVE,
      rejectReason: null,
    });
  }

  private buildRejectReason(form: RejectDocumentForm) {
    const validCodes = QUIZ_REVIEW_CRITERIA.map((criteria) => criteria.code);
    const codes = listOf(form.criteria).filter((code) =>
      validCodes.includes(code),
    );
    const note = (form.note ?? '').trim();
    if (!codes.length) {
      throw new BadRequestException('Hãy chọn ít nhất một tiêu chí vi phạm');
    }
    if (!note) {
      throw new BadRequestException('Cần nhập ghi chú lý do từ chối');
    }
    return `${codes.join(',')}: ${note}`.slice(0, 1000);
  }

  private async review(
    id: number,
    reviewer: Users,
    requiredStatus: QuizStatus,
    result: { status: QuizStatus; rejectReason: string | null },
  ) {
    const quiz = await this.quizRepository.findOne({
      where: { id, status: Not(QuizStatus.DELETED) },
      relations: [
        'createdBy',
        'subject',
        'subject.major',
        'subject.major.faculty',
      ],
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra');
    assertInFacultyScope(
      facultyScopeOf(reviewer),
      quiz.subject?.major?.faculty?.id,
    );
    if (quiz.status !== requiredStatus) {
      throw new BadRequestException(
        'Trạng thái hiện tại của bài kiểm tra không cho phép thao tác này',
      );
    }
    quiz.status = result.status;
    quiz.rejectReason = result.rejectReason;
    quiz.reviewedBy = reviewer;
    quiz.dateReviewed = new Date();
    return this.quizRepository.save(quiz);
  }
}

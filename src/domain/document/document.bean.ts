import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentStatus } from '../enums';
import {
  FacultyScope,
  applyFacultyScope,
  assertInFacultyScope,
  facultyScopeOf,
} from '../faculty-scope';
import { REVIEW_CRITERIA } from './document.criteria';
import { RejectDocumentForm, listOf } from '../forms';
import { Users } from '../user/entity/user.entity';
import { PAGE_SIZE, likeOf, offsetOf } from '../paging';
import { Documents } from './entity/document.entity';

interface NameCount {
  name: string;
  count: number;
}

type RawNameCount = { name: string; count: string };

const toNameCounts = (rows: RawNameCount[]): NameCount[] =>
  rows.map((row) => ({ name: row.name, count: Number(row.count) }));

@Injectable()
export class DocumentBean {
  constructor(
    @InjectRepository(Documents)
    private readonly documentRepository: Repository<Documents>,
  ) {}

  private scoped(scope: FacultyScope) {
    const query = this.documentRepository.createQueryBuilder('document');
    if (scope === null) return query;
    query
      .innerJoin('document.subject', 'scopeSubject')
      .innerJoin('scopeSubject.major', 'scopeMajor');
    return applyFacultyScope(query, scope, '"scopeMajor"."faculty_id"');
  }

  async countByStatus(scope: FacultyScope) {
    const rows = await this.scoped(scope)
      .select('document.status', 'status')
      .addSelect('COUNT(document.id)', 'count')
      .groupBy('document.status')
      .getRawMany<{ status: DocumentStatus; count: string }>();
    const countByStatus = {} as Record<DocumentStatus, number>;
    for (const status of Object.values(DocumentStatus)) {
      countByStatus[status] = 0;
    }
    for (const row of rows) countByStatus[row.status] = Number(row.count);
    return countByStatus;
  }

  async countByFaculty(scope: FacultyScope) {
    const rows = await this.scoped(scope)
      .leftJoin('document.subject', 'subject')
      .leftJoin('subject.major', 'major')
      .leftJoin('major.faculty', 'faculty')
      .select("COALESCE(faculty.name, '(chưa phân khoa)')", 'name')
      .addSelect('COUNT(document.id)', 'count')
      .groupBy('faculty.name')
      .orderBy('COUNT(document.id)', 'DESC')
      .getRawMany<RawNameCount>();
    return toNameCounts(rows);
  }

  async countByMonthSince(since: Date, scope: FacultyScope) {
    const month = "to_char(document.dateCreated, 'YYYY-MM')";
    const rows = await this.scoped(scope)
      .andWhere('document.dateCreated >= :since', { since })
      .select(month, 'name')
      .addSelect('COUNT(document.id)', 'count')
      .groupBy(month)
      .orderBy(month, 'ASC')
      .getRawMany<RawNameCount>();
    return toNameCounts(rows);
  }

  async findTopUploaders(limit: number, scope: FacultyScope) {
    const rows = await this.scoped(scope)
      .innerJoin('document.uploader', 'uploader')
      .andWhere('document.status = :status', { status: DocumentStatus.ACTIVE })
      .select('uploader.fullName', 'name')
      .addSelect('COUNT(document.id)', 'count')
      .groupBy('uploader.id')
      .addGroupBy('uploader.fullName')
      .orderBy('COUNT(document.id)', 'DESC')
      .limit(limit)
      .getRawMany<RawNameCount>();
    return toNameCounts(rows);
  }

  async search(
    keyword: string,
    status: DocumentStatus | undefined,
    page: number,
    scope: FacultyScope,
  ) {
    const oldestFirst = status === DocumentStatus.PENDING;
    const query = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploader', 'uploader')
      .leftJoinAndSelect('document.subject', 'subject')
      .leftJoinAndSelect('subject.major', 'major')
      .leftJoinAndSelect('major.faculty', 'faculty')
      .orderBy('document.dateCreated', oldestFirst ? 'ASC' : 'DESC')
      .skip(offsetOf(page))
      .take(PAGE_SIZE);
    applyFacultyScope(query, scope, 'faculty.id');
    if (status) query.andWhere('document.status = :status', { status });
    if (keyword) {
      query.andWhere('document.title ILIKE :like', { like: likeOf(keyword) });
    }
    const [documents, total] = await query.getManyAndCount();
    return { documents, total };
  }

  async findById(id: number, scope: FacultyScope) {
    const document = await this.documentRepository.findOne({
      where: { id: String(id) },
      relations: [
        'uploader',
        'subject',
        'subject.major',
        'subject.major.faculty',
        'reviewedBy',
      ],
    });
    if (!document) throw new NotFoundException('Không tìm thấy tài liệu');
    assertInFacultyScope(scope, document.subject?.major?.faculty?.id);
    return document;
  }

  approve(id: number, reviewer: Users) {
    return this.review(id, reviewer, DocumentStatus.PENDING, {
      status: DocumentStatus.ACTIVE,
      rejectReason: null,
    });
  }

  reject(id: number, reviewer: Users, form: RejectDocumentForm) {
    const rejectReason = this.buildRejectReason(form);
    return this.review(id, reviewer, DocumentStatus.PENDING, {
      status: DocumentStatus.REJECTED,
      rejectReason,
    });
  }

  hide(id: number, reviewer: Users) {
    return this.review(id, reviewer, DocumentStatus.ACTIVE, {
      status: DocumentStatus.INACTIVE,
      rejectReason: null,
    });
  }

  show(id: number, reviewer: Users) {
    return this.review(id, reviewer, DocumentStatus.INACTIVE, {
      status: DocumentStatus.ACTIVE,
      rejectReason: null,
    });
  }

  private buildRejectReason(form: RejectDocumentForm) {
    const validCodes = REVIEW_CRITERIA.map((criteria) => criteria.code);
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
    requiredStatus: DocumentStatus,
    result: { status: DocumentStatus; rejectReason: string | null },
  ) {
    const document = await this.findReviewable(id, reviewer, requiredStatus);
    document.status = result.status;
    document.rejectReason = result.rejectReason;
    document.reviewedBy = reviewer;
    document.dateReviewed = new Date();
    return this.documentRepository.save(document);
  }

  private async findReviewable(
    id: number,
    reviewer: Users,
    requiredStatus: DocumentStatus,
  ) {
    const document = await this.documentRepository.findOne({
      where: { id: String(id) },
      relations: [
        'uploader',
        'subject',
        'subject.major',
        'subject.major.faculty',
      ],
    });
    if (!document) throw new NotFoundException('Không tìm thấy tài liệu');
    assertInFacultyScope(
      facultyScopeOf(reviewer),
      document.subject?.major?.faculty?.id,
    );
    if (document.status !== requiredStatus) {
      throw new BadRequestException(
        'Trạng thái hiện tại của tài liệu không cho phép thao tác này',
      );
    }
    return document;
  }
}
